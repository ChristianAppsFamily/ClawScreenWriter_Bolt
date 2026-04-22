const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywrapqcoucviwvzolmrp.supabase.co';
// Get the actual anon key from the project
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyYXBxcWNvdWN2aXd2em9sbXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzIwMDAsImV4cCI6MjA1MjQwODAwMH0.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('Testing authentication...');
  
  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'Crossworkspictures@gmail.com',
    password: 'OpenClaw@1234'
  });
  
  if (error) {
    console.error('Sign in error:', error.message);
    
    // Try to sign up if user doesn't exist
    console.log('Trying to sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'Crossworkspictures@gmail.com',
      password: 'OpenClaw@1234'
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError.message);
      return null;
    }
    
    console.log('Signed up successfully:', signUpData.user?.id);
    return signUpData.session;
  } else {
    console.log('Signed in successfully:', data.user?.id);
    console.log('Session token:', data.session?.access_token.substring(0, 20) + '...');
    return data.session;
  }
}

testAuth().then(session => {
  if (session) {
    console.log('\nAuth successful! Ready to create scripts.');
  }
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
