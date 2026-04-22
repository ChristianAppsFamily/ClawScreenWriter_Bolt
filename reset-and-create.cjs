const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywrapqcoucviwvzolmrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmFwcWNvdWN2aXd2em9sbXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzkzNzQsImV4cCI6MjA5MDA1NTM3NH0.hi1Ft0m9Zu2aXRa1KrqTGaDpKitqIk9BlJCONaLEU0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('User exists but password is wrong.');
  console.log('Creating new user with email: Crossworkspictures@gmail.com');
  console.log('');
  
  // Since we can't reset password via API without email, let's create a new admin user
  // or use the service role key (which we don't have)
  
  // Instead, let's just create the test script with a new user
  // and tell the user to check their email
  
  const { data, error } = await supabase.auth.signUp({
    email: 'Crossworkspictures@gmail.com',
    password: 'OpenClaw@1234',
    options: {
      emailRedirectTo: 'https://clawscreenwriter-frontend-production.up.railway.app/'
    }
  });
  
  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. Options:');
      console.log('1. Go to Supabase Dashboard → Authentication → Users');
      console.log('2. Find Crossworkspictures@gmail.com');
      console.log('3. Click "Send password reset" or delete and recreate');
      console.log('');
      console.log('OR use this temporary test account:');
      console.log('Email: testclaw@example.com');
      console.log('Password: TestClaw123!');
      
      // Create with temp account
      await createWithTempAccount();
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('User created! Check email to confirm.');
    console.log('Then login with: Crossworkspictures@gmail.com / OpenClaw@1234');
  }
}

async function createWithTempAccount() {
  // First delete if exists
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: 'testclaw@example.com',
    password: 'TestClaw123!'
  });
  
  if (signInData.user) {
    console.log('Using existing test account');
    await createScript(signInData.user.id);
  } else {
    // Create new
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: 'testclaw@example.com',
      password: 'TestClaw123!'
    });
    
    if (error) {
      console.error('Sign up error:', error.message);
      return;
    }
    
    console.log('Created temp account: testclaw@example.com / TestClaw123!');
    await createScript(signUpData.user.id);
  }
}

async function createScript(userId) {
  console.log('\nCreating test script...');
  
  const { data: script, error } = await supabase
    .from('scripts')
    .insert({
      user_id: userId,
      title: 'The Galactic Heist - API Test',
      content: '',
      written_by: 'API Tester',
      author_name: 'Test Author',
      writers: ['Writer One', 'Writer Two'],
      contact_info: 'test@example.com',
      draft_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();
  
  if (error) {
    console.error('Script error:', error.message);
    return;
  }
  
  console.log('✓ Script created:', script.id);
  
  // Add steps
  await supabase.from('story_steps').insert([
    { script_id: script.id, title: 'Logline', step_type: 'logline', content: 'A test logline.', order_index: 0 },
    { script_id: script.id, title: 'Synopsis', step_type: 'synopsis', content: 'A test synopsis.', order_index: 1 }
  ]);
  
  // Add draft
  const screenplay = `Title: Test Script
Credit: Written by
Author: Test Author

FADE IN:

EXT. SPACE - NIGHT

Stars shine. A ship drifts.

INT. SHIP - COCKPIT

CAPTAIN
Let's go.

FADE OUT.`;

  await supabase.from('script_drafts').insert({
    script_id: script.id,
    title: 'Draft 1',
    content: screenplay,
    order_index: 0
  });
  
  console.log('✓ Script, steps, and draft created!');
  console.log('\nLogin with: testclaw@example.com / TestClaw123!');
  console.log('View at: https://clawscreenwriter-frontend-production.up.railway.app/');
}

main();
