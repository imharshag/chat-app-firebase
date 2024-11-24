import React, { useState, useEffect } from "react";
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";

const SpeechToText = ({ setTranscribedText }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcriptionJobName, setTranscriptionJobName] = useState("");
  const [transcribeClient] = useState(new TranscribeClient({ region: "your-region" })); // e.g., "us-east-1"

  const handleMicClick = async () => {
    if (!isRecording) {
      // Start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.start();
      
      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await uploadToS3(audioBlob); // Upload audio to S3
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
    } else {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadToS3 = async (audioBlob) => {
    // Implement your S3 upload logic here.
    // After uploading, start transcription job.
    const audioUrl = await uploadAudioToS3(audioBlob); // Implement this function

    const jobName = `transcription-job-${Date.now()}`;
    setTranscriptionJobName(jobName);

    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: "en-US", // Change as needed
      Media: { MediaFileUri: audioUrl },
      MediaFormat: "wav",
      OutputBucketName: "your-s3-bucket-name",
    });

    try {
      await transcribeClient.send(command);
      console.log("Transcription job started");
      pollTranscriptionResult(jobName);
    } catch (error) {
      console.error("Error starting transcription job:", error);
    }
  };

  const pollTranscriptionResult = (jobName) => {
    const interval = setInterval(async () => {
      const command = new GetTranscriptionJobCommand({ TranscriptionJobName: jobName });

      try {
        const response = await transcribeClient.send(command);
        if (response.TranscriptionJob.TranscriptionJobStatus === "COMPLETED") {
          clearInterval(interval);
          const transcriptUrl = response.TranscriptionJob.Transcript.TranscriptFileUri;
          const transcriptResponse = await fetch(transcriptUrl);
          const transcriptData = await transcriptResponse.json();
          const text = transcriptData.results.transcripts[0].transcript;
          setTranscribedText(text);
        } else if (response.TranscriptionJob.TranscriptionJobStatus === "FAILED") {
          clearInterval(interval);
          console.error("Transcription job failed");
        }
      } catch (error) {
        console.error("Error fetching transcription result:", error);
      }
    }, 5000); // Poll every 5 seconds
  };

  return (
    <button onClick={handleMicClick} className="mic-button">
      {isRecording ? "🛑" : "🎤"}
    </button>
  );
};

export default SpeechToText;
