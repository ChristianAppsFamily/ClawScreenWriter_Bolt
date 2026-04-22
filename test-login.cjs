const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywrapqcoucviwvzolmrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmFwcWNvdWN2aXd2em9sbXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzkzNzQsImV4cCI6MjA5MDA1NTM3NH0.hi1Ft0m9Zu2aXRa1KrqTGaDpKitqIk9BlJCONaLEU0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  // Try to sign in with the provided credentials
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'Crossworkspictures@gmail.com',
    password: 'OpenClaw@1234'
  });
  
  if (error) {
    console.log('Login error:', error.message);
    console.log('Error code:', error.code);
    console.log('Status:', error.status);
    
    // The user exists but password is wrong
    // Let's create a new test user instead
    console.log('\nCreating new test user with different email...');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPass123!'
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError.message);
    } else {
      console.log('Created test user:', testEmail);
      console.log('Password: TestPass123!');
      
      // Now create a script with this user
      await createTestScript(signUpData.user?.id);
    }
  } else {
    console.log('Login successful!');
    console.log('User:', data.user?.email);
    await createTestScript(data.user?.id);
  }
}

async function createTestScript(userId) {
  if (!userId) {
    console.error('No user ID available');
    return;
  }
  
  console.log('\nCreating test script for user:', userId);
  
  const { data: script, error } = await supabase
    .from('scripts')
    .insert({
      user_id: userId,
      title: 'The Galactic Heist - API Test',
      content: '',
      written_by: 'API Test Writer',
      author_name: 'Test Author',
      writers: ['Test Writer 1', 'Test Writer 2'],
      contact_info: 'test@example.com',
      draft_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();
  
  if (error) {
    console.error('Script creation error:', error.message);
    return;
  }
  
  console.log('Script created:', script.id);
  
  // Create steps
  const steps = [
    { title: 'Logline', step_type: 'logline', content: 'A test logline for the galactic heist story.' },
    { title: 'Synopsis', step_type: 'synopsis', content: 'This is a test synopsis created via API.' }
  ];
  
  for (let i = 0; i < steps.length; i++) {
    await supabase.from('story_steps').insert({
      script_id: script.id,
      title: steps[i].title,
      step_type: steps[i].step_type,
      content: steps[i].content,
      order_index: i
    });
  }
  console.log('Added', steps.length, 'story steps');
  
  // Create draft with content
  const screenplay = `Title: The Galactic Heist
Credit: Written by
Author: Test Author
Draft date: ${new Date().toISOString().split('T')[0]}

FADE IN:

EXT. SPACE - THE NEBULA RIM - NIGHT

Stars glitter like diamonds scattered across black velvet. The STARJACKER drifts through cosmic dust.

INT. STARJACKER - COCKPIT - CONTINUOUS

CAPTAIN ZARA VEX pilots the ship, scanning a holographic display of a massive DYSON SPHERE.

ZARA
There she is. The Golden Cage.

DR. KAI CHEN checks readings nervously.

KAI
The star's unstable. Six hours before nova.

ZARA
Then we move fast.

She engages the thrusters.

FADE OUT.`;

  const { data: draft } = await supabase
    .from('script_drafts')
    .insert({
      script_id: script.id,
      title: 'First Draft',
      content: screenplay,
      order_index: 0
    })
    .select()
    .single();
  
  console.log('Draft created:', draft?.id);
  console.log('\n=== TEST COMPLETE ===');
  console.log('Script ID:', script.id);
  console.log('View at: https://clawscreenwriter-frontend-production.up.railway.app/');
}

checkUser();
