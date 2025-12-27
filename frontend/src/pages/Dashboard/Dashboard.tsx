import { useState } from 'react';
import {
  Layout,
  Button,
  Avatar,
  Tag,
  Card,
  Input,
  Space,
  Progress,
  Typography,
  Divider,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  EllipsisOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ThunderboltOutlined,
  AudioOutlined,
  PictureOutlined
} from '@ant-design/icons';
import AudioRecorder from '../../components/AudioRecorder';
import { TemplateAnalyzer } from '../../components/FileUploadPanel';
import { uploadTemplateImage } from '../../api/template';
import styles from './Dashboard.module.css';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import PDFPreview from '../../components/PDFPreview';
import type { PDFDocument } from '../../api/pdf';
import { getAvatarUrl } from '../../utils/file';

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  // Load mock PDFs for now - TODO: Implement real PDF fetching with accessToken
  useEffect(() => {
    // Mock data for development
    setPdfs([
      {
        id: 'pdf-1',
        conversationId: 'conv-123',
        fileName: 'Bài giảng Machine Learning.pdf',
        fileUrl: 'https://example.com/lecture-1.pdf',
        fileSize: 1024000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pdf-2',
        conversationId: 'conv-456',
        fileName: 'Giới thiệu về AI và Deep Learning.pdf',
        fileUrl: 'https://example.com/lecture-2.pdf',
        fileSize: 2048000,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ]);
  }, []);
  
  const handleSubmit = () => {
    if (!input.trim()) return;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const handleTranscriptReady = (transcript: string) => {
    setInput(transcript);
    setActiveTab('text');
  };

  const handleImageUploadConfirm = async (
    templateImage: File | null,
    topic: string,
    analysisResult: any
  ) => {
    if (!templateImage || !topic.trim()) {
      alert('Vui lòng upload ảnh template và nhập chủ đề!');
      return;
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // User comes from AuthContext via ProtectedRoute, no need to check loading
  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

      // Upload template to MinIO
      const uploadedTemplate = await uploadTemplateImage(templateImage);
      console.log('Upload thành công:', uploadedTemplate);

      // Show success alert
      alert('Upload thành công!\n\n' +
        `Chủ đề: ${topic}\n\n` +
        `Template ID: ${uploadedTemplate.id}\n\n` +
        `File URL: ${uploadedTemplate.fileUrl}\n\n` +
        `Phân tích:\n${JSON.stringify(analysisResult, null, 2)}`);

      // Switch về text tab
      setActiveTab('text');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Lỗi upload: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  };

  return (
    <Layout className={styles.layout}>
      {/* LEFT SIDEBAR */}
      <Sider width={260} className={styles.sider}>
        <div className={styles.siderContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🎓</div>
            <Title level={4} className={styles.logoText}>LectGen-AI</Title>
          </div>

          {/* New Presentation Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            block
            className={styles.newPresentationBtn}
          >
            New Presentation
          </Button>

          {/* Chat History */}
          <div className={styles.chatHistory}>
            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>TODAY</Text>
              <div>
                {chatHistory.today.map((item, index) => (
                  <div
                    key={index}
                    className={item.active ? styles.chatItemActive : styles.chatItem}
                  >
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>YESTERDAY</Text>
              <div>
                {chatHistory.yesterday.map((item, index) => (
                  <div key={index} className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>PREVIOUS 7 DAYS</Text>
              <div>
                {chatHistory.previous.map((item, index) => (
                  <div key={index} className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className={styles.siderBottom}>
            {/* Usage */}
            <div className={styles.usageSection}>
              <Text className={styles.usageLabel}>Daily Limit</Text>
              <Text className={styles.usageText}>2/5 slides generated</Text>
              <Progress
                percent={40}
                showInfo={false}
                strokeColor="#1677FF"
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* User Card */}
            <div className={styles.userCard}>
              <Avatar size={40} icon={<UserOutlined />} className={styles.userAvatar} />
              <div className={styles.userInfo}>
                <Text strong className={styles.userName}>John Doe</Text>
                <Tag color="default" className={styles.userTag}>Free Plan</Tag>
              </div>
            </div>

            {/* Upgrade Button */}
            <Button
              block
              size="large"
              className={styles.upgradeBtn}
              icon={<ThunderboltOutlined />}
            >
              Upgrade to VIP
            </Button>
          </div>
        </div>
      </Sider>

      {/* MAIN CONTENT */}
      <Layout>
        {/* Header */}
        <Header className={styles.header}>
          <Text className={styles.headerTitle}>
            Current Chat: <strong>{currentChat}</strong>
          </Text>
          <Button type="text" icon={<EllipsisOutlined />} />
        </Header>

        {/* Chat Content */}
        <Content className={styles.content}>
          <div className={styles.messagesContainer}>
            {/* Render dynamic messages */}
            {messages.length === 0 ? (
              // Show placeholder when no messages
              <>
                {/* User Message */}
                <div className={styles.messageRow}>
                  <div className={styles.userMessage}>
                    <div className={styles.messageBubble}>
                      <Text className={styles.messageText}>
                        I need a presentation for our 2024 Marketing Strategy. It should cover our Q1
                        achievements, Q2 goals, and the new social media campaign. Keep it professional
                        and clean. About 10 slides.
                      </Text>
                      <Text className={styles.timestamp}>10:42 AM</Text>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className={styles.messageRow}>
                  <div className={styles.aiMessage}>
                    <Avatar
                      icon={<RobotOutlined />}
                      className={styles.aiAvatar}
                      size={32}
                    />
                    <div>
                      <div className={styles.aiTextBubble}>
                        <Text>
                          I've generated a draft for your 2024 Marketing Strategy. It includes sections for Q1 review,
                          Q2 objectives, and a detailed breakdown of the social media channels.
                        </Text>
                      </div>

                      {/* Presentation Card */}
                      <Card className={styles.presentationCard}>
                        <div className={styles.cardContent}>
                          {/* Thumbnail */}
                          <div className={styles.thumbnail}>
                            <div className={styles.thumbnailPlaceholder}>
                              <FileTextOutlined style={{ fontSize: 48, color: '#1677FF' }} />
                            </div>
                            <div className={styles.slideOverlay}>Cover Slide</div>
                          </div>

                          {/* Details */}
                          <div className={styles.cardDetails}>
                            <div className={styles.cardHeader}>
                              <Title level={5} className={styles.cardTitle}>
                                Marketing Strategy 2024
                              </Title>
                              <Tag color="success" className={styles.readyTag}>READY</Tag>
                            </div>

                            <Paragraph className={styles.cardDescription}>
                              Comprehensive deck covering Q1 objectives, Q2 OKRs, and
                              Social Media tactical roadmap.
                            </Paragraph>

                            <div className={styles.cardMeta}>
                              <Space size={16}>
                                <Text type="secondary">📊 10 Slides</Text>
                                <Text type="secondary">⏱ ~30s gen time</Text>
                                <Text type="secondary">📁 2.4 MB</Text>
                              </Space>
                            </div>

                            <div className={styles.cardActions}>
                              <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                size="large"
                                className={styles.downloadBtn}
                              >
                                Download PDF
                              </Button>
                              <Button
                                icon={<ReloadOutlined />}
                                size="large"
                              />
                              <Button
                                icon={<EditOutlined />}
                                size="large"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Text className={styles.timestamp}>10:43 AM</Text>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Render actual messages from state
              messages.map((msg) => (
                <div key={msg.id} className={styles.messageRow}>
                  <div className={msg.type === 'user' ? styles.userMessage : styles.aiMessage}>
                    {msg.type === 'ai' && (
                      <Avatar
                        icon={<RobotOutlined />}
                        className={styles.aiAvatar}
                        size={32}
                      />
                    )}
                    <div className={msg.type === 'user' ? styles.messageBubble : ''}>
                      <Text className={styles.messageText}>{msg.content}</Text>
                      {msg.template && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                          Template: {msg.template.fileName}<br />
                          Style: {msg.template.analysisResult?.colorScheme}<br />
                          Layout: {msg.template.analysisResult?.layoutType}
                        </div>
                      )}
                      <Text className={styles.timestamp}>{msg.timestamp}</Text>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              items={[
                {
                  key: 'text',
                  label: (
                    <span>
                      <FileTextOutlined /> Text
                    </span>
                  ),
                  children: (
                    <>
                      {/* Suggestion Chips */}
                      <div className={styles.suggestions}>
                        {suggestions.map((item, index) => (
                          <Button
                            key={index}
                            icon={item.icon}
                            className={styles.suggestionChip}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </div>

                      {/* Input Bar */}
                      <div className={styles.inputBar}>
                        <Input
                          size="large"
                          placeholder="Describe your topic (e.g., 'History of Jazz Music with 5 slides')..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onPressEnter={handleSend}
                          className={styles.input}
                          suffix={
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<SendOutlined />}
                              onClick={handleSend}
                              disabled={!input.trim()}
                              className={styles.sendBtn}
                            />
                          }
                        />
                      </div>

                      <Text type="secondary" className={styles.disclaimer}>
                        AI can make mistakes. Please review generated slides before presenting.
                      </Text>
                    </>
                  ),
                },
                {
                  key: 'audio',
                  label: (
                    <span>
                      <AudioOutlined /> Audio Input
                    </span>
                  ),
                  children: <AudioRecorder onTranscriptReady={handleTranscriptReady} />,
                },
                {
                  key: 'image',
                  label: (
                    <span>
                      <PictureOutlined /> Image / Template Input
                    </span>
                  ),
                  children: <TemplateAnalyzer onConfirm={handleImageUploadConfirm} />,
                },
              ]}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}