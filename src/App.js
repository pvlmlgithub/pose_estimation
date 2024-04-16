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
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720,
    });

    // Decode base64 encoded image data
    const base64ImageData = imageSrc.split(",")[1];
    const decodedImageData = atob(base64ImageData);
    const randomString = Math.random().toString(36).substring(7);
    // Convert decoded image data into a Blob
    const arrayBuffer = new ArrayBuffer(decodedImageData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < decodedImageData.length; i++) {
      uint8Array[i] = decodedImageData.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

    // Create a File object from the Blob
    const filename = `screenshot_${Date.now()}_${randomString}.jpg`;

    const file = new File([blob], filename, { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(API_ENDPOINT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResponse((prevResponse) => [...prevResponse, res.data]);
      if (res.data.Posture === "proper") {
        setProperCount((prevCount) => prevCount + 1);
      } else if (res.data.Posture === "improper") {
        setImproperCount((prevCount) => prevCount + 1);
      } else if (res.data.Error) {
        setIsCapturing(false);
        alert("Please sit in front of camera");
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
      }, 3000); // Capture every minute
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isCapturing]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const videoConstraints = {
    facingMode: "user",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
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
          background: "black",
          color: "white",
        }}
      >
        <div style={{ marginRight: "20px" }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            videoConstraints={videoConstraints}
          />
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
        <div
          style={{
            height: "80%",
            width: "30%",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <h2>API Response:</h2>
          <div
            style={{
              height: "260px",
              overflow: "hidden",
              overflowX: "auto",
              fontSize: "18px",
              fontWeight: "800",
            }}
          >
            {response?.map((data, index) => (
              <div
                key={index}
                style={{
                  textTransform: "capitalize",
                  color:
                    data.Posture === "proper"
                      ? "green"
                      : data.Posture === "improper"
                      ? "red"
                      : "black",
                }}
              >
                {data.Posture}
              </div>
            ))}
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default App;
