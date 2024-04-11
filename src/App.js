import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";

const API_ENDPOINT = "https://poseestimation.ddns.net/upload";

const App = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [response, setResponse] = useState([]);
  const [properCount, setProperCount] = useState(0);
  const [improperCount, setImproperCount] = useState(0);
  const [properPercentage, setProperPercentage] = useState(0);

  const webcamRef = React.useRef(null);

  const captureScreenshot = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    // Decode base64 encoded image data
    const base64ImageData = imageSrc.split(",")[1];
    const decodedImageData = atob(base64ImageData);

    // Convert decoded image data into a Blob
    const arrayBuffer = new ArrayBuffer(decodedImageData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < decodedImageData.length; i++) {
      uint8Array[i] = decodedImageData.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

    // Create a File object from the Blob
    const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(API_ENDPOINT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setResponse((prevResponse) => [...prevResponse, res.data]);
      if (res.data.Posture === "proper") {
        setProperCount((prevCount) => prevCount + 1);
      } else if (res.data.Posture === "improper") {
        setImproperCount((prevCount) => prevCount + 1);
      } else if (res.data.Error){
        alert("Please sit in front of camera")
      }
    } catch (error) {
      console.error("Error sending screenshot:", error);

    }
  };
  console.log("Response from API:", response, properCount, improperCount);

  const stopCapturing = () => {
    setIsCapturing(false);
    const totalCount = properCount + improperCount;
    const properPercentage = (properCount / totalCount) * 100;
    setProperPercentage(properPercentage);
  };

  useEffect(() => {
    let intervalId;
    if (isCapturing) {
      intervalId = setInterval(() => {
        captureScreenshot();
      }, 6000); // Capture every minute
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isCapturing]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        background: "black",
        color: "white",
      }}
    >
      <h1>Welcome to SIT-FIT</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "black",
          color: "white",
        }}
      >
        <div style={{ marginRight: "20px" }}>
          <Webcam audio={false} ref={webcamRef} />
          <div style={{ marginTop: "10px" }}>
            {!isCapturing ? (
              <button
                className="button-37"
                onClick={() => setIsCapturing(true)}
              >
                Start Capturing
              </button>
            ) : (
              <button className="button-38" onClick={stopCapturing}>
                Stop Capturing
              </button>
            )}
          </div>
        </div>
        <div style={{ height: "80%", width: "30%" }}>
          <h2>API Response:</h2>
          <div>
            {response?.map((data, index) => (
              <div key={index} style={{ textTransform: "capitalize" }}>
                {data.Posture}
              </div>
            ))}
          </div>
          {properPercentage > 0 && (
            <div>
              <h2>
                Proper Sitting Percentage:{" "}
                <span
                  style={{
                    color:
                      properPercentage < 30
                        ? "red"
                        : properPercentage < 55
                        ? "yellow"
                        : "green",
                  }}
                >
                  {properPercentage.toFixed(2)}%
                </span>
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
