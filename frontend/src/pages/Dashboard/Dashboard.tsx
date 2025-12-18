import { useState } from 'react';
import { 
  Layout, 
  Button, 
  List, 
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
  AudioOutlined
} from '@ant-design/icons';
import AudioRecorder from '../../components/AudioRecorder';
import styles from './Dashboard.module.css';
import { logout } from '../../utils/auth';
import PDFPreview from '../../components/PDFPreview';
import { getUserPDFs } from '../../api/pdf';
import { getProfile } from '../../api/user';
import type { PDFDocument } from '../../api/pdf';
import { getAvatarUrl } from '../../utils/file';

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [isLoadingPDFs, setIsLoadingPDFs] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getProfile();
        if (response.success) {
          setUser(response.data.user); // Fix: response.data.user chứ không phải response.data
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Redirect to login if unauthorized
        logout();
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch user's PDFs on mount
  useEffect(() => {
    const fetchPDFs = async () => {
      setIsLoadingPDFs(true);
      try {
        const data = await getUserPDFs();
        setPdfs(data);
      } catch (error) {
        console.error('Failed to fetch PDFs:', error);
        // Fall back to mock data for development
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
      } finally {
        setIsLoadingPDFs(false);
      }
    };

    fetchPDFs();
  }, []);
  
  const handleSubmit = () => {
    if (!input.trim()) return;
    // TODO: Send message to backend
    console.log('Send message:', input);
  };

  const handleLogout = () => {
    logout(); // Hàm logout đã có window.location.href, không cần navigate
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Show loading state
  if (isLoadingUser || !user) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

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
              <List
                dataSource={chatHistory.today}
                renderItem={item => (
                  <List.Item 
                    className={item.active ? styles.chatItemActive : styles.chatItem}
                  >
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </List.Item>
                )}
              />
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>YESTERDAY</Text>
              <List
                dataSource={chatHistory.yesterday}
                renderItem={item => (
                  <List.Item className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </List.Item>
                )}
              />
            </div>

            <div className={styles.historySection}>
              <Text className={styles.sectionLabel}>PREVIOUS 7 DAYS</Text>
              <List
                dataSource={chatHistory.previous}
                renderItem={item => (
                  <List.Item className={styles.chatItem}>
                    <FileTextOutlined className={styles.chatIcon} />
                    <Text className={styles.chatTitle}>{item.title}</Text>
                  </List.Item>
                )}
              />
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

        <div className={styles.inputSection}>
          <div className={styles.inputWrapper}>
            <button className={styles.addBtn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <input
              type="text"
              className={styles.input}
              placeholder="Hỏi bất kỳ điều gì"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button className={styles.voiceBtn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 013 3v8a3 3 0 11-6 0V4a3 3 0 013-3z" stroke="currentColor" strokeWidth="2" />
                <path d="M19 10v2a7 7 0 11-14 0v-2M12 19v4m-4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M10 8l6 4-6 4V8z" fill="white" />
              </svg>
            </button>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

