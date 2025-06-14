// Test script for sentiment simulation
// Run this in the browser console on the Support page

// Function to trigger sentiment simulation with different scenarios
function testSentimentScenarios() {
  console.log('🧪 Starting Sentiment Simulation Tests...\n');
  
  // Test 1: Balanced Sentiment
  console.log('📊 Test 1: Balanced Sentiment (Mixed feedback)');
  console.log('Expected: Mix of positive (40%), neutral (30%), and negative (30%) sentiments');
  console.log('Service Levels: Basic (50%), Premium (30%), Enterprise (20%)');
  console.log('→ Click "Balanced Sentiment" and "Start" in the simulation controls\n');
  
  // Test 2: Very Negative Sentiment
  setTimeout(() => {
    console.log('😠 Test 2: Very Negative Sentiment');
    console.log('Expected: Predominantly negative feedback');
    console.log('→ Switch to "Very Negative Sentiment" scenario\n');
  }, 10000);
  
  // Test 3: Positive Sentiment
  setTimeout(() => {
    console.log('😊 Test 3: Positive Sentiment');
    console.log('Expected: Mostly positive customer satisfaction');
    console.log('→ Switch to "Positive Sentiment" scenario\n');
  }, 20000);
}

// Function to simulate chat interactions
function simulateChatInteractions() {
  console.log('💬 Simulating Chat Interactions...\n');
  
  const messages = [
    { text: "I can't log into my account", expectNegative: true },
    { text: "Your service is amazing, thank you!", expectPositive: true },
    { text: "How do I update my billing information?", expectNeutral: true },
    { text: "This is terrible, nothing works!", expectNegative: true },
    { text: "Great support, very helpful!", expectPositive: true }
  ];
  
  messages.forEach((msg, index) => {
    setTimeout(() => {
      console.log(`Sending: "${msg.text}"`);
      console.log(`Expected response sentiment: ${msg.expectPositive ? 'Positive' : msg.expectNegative ? 'Negative' : 'Neutral'}`);
      
      // Simulate typing and sending
      const input = document.querySelector('input[placeholder="Type your message..."]');
      const sendButton = document.querySelector('button[type="submit"]');
      
      if (input && sendButton) {
        input.value = msg.text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        sendButton.click();
      }
    }, index * 5000);
  });
}

// Function to test thumbs up/down functionality
function testThumbsButtons() {
  console.log('👍👎 Testing Thumbs Up/Down Buttons...\n');
  
  setTimeout(() => {
    const thumbsButtons = document.querySelectorAll('button svg.lucide-thumbs-up, button svg.lucide-thumbs-down');
    console.log(`Found ${thumbsButtons.length} thumbs buttons`);
    
    // Click some thumbs up
    const thumbsUpButtons = document.querySelectorAll('button svg.lucide-thumbs-up');
    thumbsUpButtons.forEach((btn, index) => {
      if (index % 2 === 0) {
        setTimeout(() => {
          btn.parentElement.click();
          console.log('Clicked thumbs up - sentiment should increase');
        }, index * 1000);
      }
    });
    
    // Click some thumbs down
    const thumbsDownButtons = document.querySelectorAll('button svg.lucide-thumbs-down');
    thumbsDownButtons.forEach((btn, index) => {
      if (index % 3 === 0) {
        setTimeout(() => {
          btn.parentElement.click();
          console.log('Clicked thumbs down - sentiment should decrease');
        }, index * 1000 + 500);
      }
    });
  }, 5000);
}

// Function to test service level changes
function testServiceLevels() {
  console.log('🏆 Testing Service Level Changes...\n');
  
  const levels = ['basic', 'premium', 'enterprise'];
  
  levels.forEach((level, index) => {
    setTimeout(() => {
      console.log(`Switching to ${level.toUpperCase()} service level`);
      console.log('This should affect the sentiment distribution and chat behavior');
      
      // Find and click the service level selector
      const trigger = document.querySelector('.w-24.h-8');
      if (trigger) {
        trigger.click();
        setTimeout(() => {
          const option = Array.from(document.querySelectorAll('[role="option"]'))
            .find(el => el.textContent.toLowerCase() === level);
          if (option) option.click();
        }, 100);
      }
    }, index * 8000);
  });
}

// Function to test chat session management
function testSessionManagement() {
  console.log('🔄 Testing Chat Session Management...\n');
  
  setTimeout(() => {
    console.log('Closing current chat session...');
    const closeButton = document.querySelector('button[title="Close chat and start new"]');
    if (closeButton) {
      closeButton.click();
      console.log('Chat closed - check Chat History for the closed session');
    }
  }, 3000);
  
  setTimeout(() => {
    console.log('New chat session should have started automatically');
    console.log('Previous session should appear in Chat History with overall sentiment');
  }, 5000);
}

// Main test runner
function runAllTests() {
  console.log('🚀 AI HelpDesk Sentiment Testing Suite\n');
  console.log('This will test various sentiment scenarios and features.');
  console.log('Watch the Live Sentiment gauge and Chat History update in real-time!\n');
  
  // Switch to simulation mode first
  toggleAIMode(false);
  
  // Run tests in sequence
  setTimeout(() => {
    testSentimentScenarios();
  }, 1000);
  
  setTimeout(() => {
    simulateChatInteractions();
  }, 6000);
  
  setTimeout(() => {
    testThumbsButtons();
  }, 16000);
  
  setTimeout(() => {
    testServiceLevels();
  }, 26000);
  
  setTimeout(() => {
    testSessionManagement();
  }, 36000);
  
  setTimeout(() => {
    console.log('\n✅ All tests completed!');
    console.log('Check the following:');
    console.log('1. Live Sentiment gauge - should show real-time updates');
    console.log('2. Trend indicator - up/down/stable arrows');
    console.log('3. Chat History - closed sessions with sentiment scores');
    console.log('4. Analytics Overview - updated conversation count and resolution rate');
  }, 46000);
}

// Function to toggle between Real AI and Simulation
function toggleAIMode(useRealAI) {
  const toggle = document.querySelector('#real-ai-toggle');
  if (toggle) {
    // Check current state
    const isChecked = toggle.getAttribute('aria-checked') === 'true';
    if (isChecked !== useRealAI) {
      toggle.click();
      console.log(useRealAI ? '🤖 Switched to Real AI mode' : '🎭 Switched to Simulation mode');
    }
  }
}

// Test Real AI Mode
function testRealAI() {
  console.log('🤖 Testing Real AI Mode...\n');
  
  toggleAIMode(true);
  
  setTimeout(() => {
    const testMessages = [
      "What are your business hours?",
      "I need help with my account settings",
      "How do I upgrade my subscription?"
    ];
    
    testMessages.forEach((msg, index) => {
      setTimeout(() => {
        console.log(`Sending to Real AI: "${msg}"`);
        const input = document.querySelector('input[placeholder="Type your message..."]');
        const sendButton = document.querySelector('button[type="submit"]');
        
        if (input && sendButton) {
          input.value = msg;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          sendButton.click();
        }
      }, index * 3000);
    });
  }, 1000);
}

// Instructions
console.log('📋 Sentiment Testing Instructions:');
console.log('1. Navigate to the Support Portal page');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste this entire script');
console.log('4. For Simulation testing: runAllTests()');
console.log('5. For Real AI testing: testRealAI()');
console.log('6. Watch the UI update in real-time!\n');
console.log('Individual test functions available:');
console.log('- toggleAIMode(true/false) - Switch between Real AI and Simulation');
console.log('- testRealAI() - Test real AI responses');
console.log('- testSentimentScenarios() - Test simulation scenarios');
console.log('- simulateChatInteractions() - Simulate various messages');
console.log('- testThumbsButtons() - Test rating functionality');
console.log('- testServiceLevels() - Test service tiers');
console.log('- testSessionManagement() - Test chat sessions');

// Make functions available globally
window.sentimentTests = {
  runAllTests,
  testRealAI,
  toggleAIMode,
  testSentimentScenarios,
  simulateChatInteractions,
  testThumbsButtons,
  testServiceLevels,
  testSessionManagement
}; 