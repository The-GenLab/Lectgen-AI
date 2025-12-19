import { configDotenv } from 'dotenv';
import aiService from './src/modules/ai/ai.service';

// Load environment variables
configDotenv();

async function quickTest() {
  console.log('🧪 Quick AI Service Test\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Basic generation
    console.log('\n📝 Test 1: Basic Generation');
    console.log('-'.repeat(60));
    
    const result = await aiService.generateSlideContent('Introduction to Docker');
    
    console.log('✅ Success!');
    console.log('   Title:', result.title);
    console.log('   Slides:', result.slides.length);
    console.log('\n   First Slide:');
    console.log('   - Title:', result.slides[0].title);
    console.log('   - Content:', result.slides[0].content);
    console.log('   - Bullets:', result.slides[0].bullet_points.length);
    console.log('   - Has note:', !!result.slides[0].note);

    // Test 2: With options
    console.log('\n📝 Test 2: With Style Options');
    console.log('-'.repeat(60));
    
    const result2 = await aiService.generateSlideContent(
      'React Hooks Explained',
      { style: 'casual', maxSlides: 6 }
    );
    
    console.log('✅ Success!');
    console.log('   Title:', result2.title);
    console.log('   Slides:', result2.slides.length);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

quickTest();
