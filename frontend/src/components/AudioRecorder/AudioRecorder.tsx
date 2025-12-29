import { useState, useRef, useEffect } from 'react';
import { Button, message, Space, Typography } from 'antd';
import { AudioOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../config/api';
import styles from './AudioRecorder.module.css';

const { Text } = Typography;

interface AudioRecorderProps {
  onTranscriptReady: (transcript: string) => void;
}

export default function AudioRecorder({ onTranscriptReady }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopMediaTracks();
    };
  }, []);

  const stopMediaTracks = () => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stopMediaTracks();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript('');
      setAudioBlob(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      message.success('Recording...');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      message.error('Cannot access microphone. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      message.error('No audio file to process');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'vi');

      const response = await fetch(`${API_BASE_URL}/speech/transcribe`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Transcription failed');
      }

      const transcriptText = data.data.transcript;
      setTranscript(transcriptText);
      onTranscriptReady(transcriptText);
      message.success('Transcription successful!');
    } catch (error: any) {
      console.error('Transcription error:', error);
      message.error(error.message || 'Cannot transcribe audio to text');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscript('');
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      {/* Recording Status */}
      <div className={styles.statusArea}>
        {isRecording && (
          <div className={styles.recordingIndicator}>
            <span className={styles.recordingDot}></span>
            <Text strong>RECORDING</Text>
            <Text className={styles.timer}>{formatTime(recordingTime)}</Text>
          </div>
        )}

        {audioBlob && !isRecording && (
          <div className={styles.audioReady}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <Text>Recorded {formatTime(recordingTime)}</Text>
          </div>
        )}

        {!isRecording && !audioBlob && (
          <div className={styles.idleState}>
            <AudioOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Text type="secondary">Press mic button to start recording</Text>
          </div>
        )}
      </div>

      {/* Waveform visualization (placeholder) */}
      {isRecording && (
        <div className={styles.waveform}>
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className={styles.waveBar}
              style={{ 
                animationDelay: `${i * 0.05}s`,
                height: `${Math.random() * 60 + 20}%` 
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript Preview */}
      {transcript && (
        <div className={styles.transcriptBox}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Nội dung:</Text>
          <Text className={styles.transcript}>{transcript}</Text>
        </div>
      )}

      {/* Action Buttons */}
      <Space size="middle" className={styles.actions}>
        {!isRecording && !audioBlob && (
          <Button
            type="primary"
            size="large"
            icon={<AudioOutlined />}
            onClick={startRecording}
            className={styles.recordBtn}
          >
            Bắt đầu ghi âm
          </Button>
        )}

        {isRecording && (
          <Button
            danger
            size="large"
            onClick={stopRecording}
            className={styles.stopBtn}
          >
            Dừng ghi âm
          </Button>
        )}

        {audioBlob && !isRecording && !transcript && (
          <>
            <Button
              type="primary"
              size="large"
              onClick={transcribeAudio}
              loading={isProcessing}
              icon={!isProcessing && <CheckCircleOutlined />}
            >
              {isProcessing ? 'Đang xử lý...' : 'Chuyển thành văn bản'}
            </Button>
            <Button size="large" onClick={resetRecording}>
              Ghi lại
            </Button>
          </>
        )}

        {transcript && (
          <Button size="large" onClick={resetRecording}>
            Ghi âm mới
          </Button>
        )}
      </Space>
    </div>
  );
}

