const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywrapqcoucviwvzolmrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmFwcWNvdWN2aXd2em9sbXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzkzNzQsImV4cCI6MjA5MDA1NTM3NH0.hi1Ft0m9Zu2aXRa1KrqTGaDpKitqIk9BlJCONaLEU0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestScript() {
  console.log('=== Creating Test Script ===\n');
  
  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'Crossworkspictures@gmail.com',
    password: 'OpenClaw@1234'
  });
  
  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  
  console.log('✓ Logged in as:', authData.user.email);
  const userId = authData.user.id;
  
  // Create script
  const { data: script, error: scriptError } = await supabase
    .from('scripts')
    .insert({
      user_id: userId,
      title: 'The Galactic Heist',
      content: '',
      written_by: 'Crossworkspictures',
      author_name: 'Test Author',
      writers: ['Writer One', 'Writer Two'],
      contact_info: 'Crossworkspictures@gmail.com',
      draft_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();
  
  if (scriptError) {
    console.error('✗ Script creation failed:', scriptError.message);
    return;
  }
  
  console.log('✓ Script created:', script.title);
  console.log('  Script ID:', script.id);
  
  // Create story steps
  const steps = [
    { title: 'Logline', step_type: 'logline', content: 'A crew of intergalactic thieves must pull off the ultimate heist: stealing a star from an alien megastructure before it goes supernova.' },
    { title: 'Synopsis', step_type: 'synopsis', content: 'In the year 3047, Captain Zara Vex leads a ragtag crew of specialists on a mission to steal energy from a dying star. But when they discover the star is actually a sentient being, they must choose between completing the heist and saving an ancient intelligence.' },
    { title: 'Characters', step_type: 'characters', content: 'CAPTAIN ZARA VEX - Fearless leader, haunted by a failed mission\nDR. KAI CHEN - Brilliant engineer with a gambling problem\nRIX - Alien pilot who can navigate quantum space\nMECHANIC JO - Muscle with a heart of gold' }
  ];
  
  for (let i = 0; i < steps.length; i++) {
    const { error } = await supabase
      .from('story_steps')
      .insert({
        script_id: script.id,
        title: steps[i].title,
        step_type: steps[i].step_type,
        content: steps[i].content,
        order_index: i
      });
    
    if (error) {
      console.error('✗ Failed to add step:', steps[i].title, error.message);
    } else {
      console.log('✓ Added step:', steps[i].title);
    }
  }
  
  // Create draft with screenplay
  const screenplay = `Title: The Galactic Heist
Credit: Written by
Author: Crossworkspictures
Draft date: ${new Date().toISOString().split('T')[0]}

FADE IN:

EXT. SPACE - THE NEBULA RIM - NIGHT

Stars glitter like diamonds scattered across black velvet. A small spacecraft, the STARJACKER, drifts silently through the cosmic dust.

INT. STARJACKER - COCKPIT - CONTINUOUS

CAPTAIN ZARA VEX (40s), scarred but striking, pilots the ship. Her eyes scan the holographic display showing a massive DYSON SPHERE in the distance.

ZARA
(quietly)
There she is. The Golden Cage.

DR. KAI CHEN (30s), nervous energy contained in a lab coat, checks readings.

KAI
The star's unstable. We have maybe six hours before it goes nova.

ZARA
Then we better move fast.

She engages the thrusters. The ship accelerates toward the megastructure.

EXT. DYSON SPHERE - OUTER HULL - LATER

The Starjacker attaches to the sphere's surface with magnetic clamps.

INT. STARJACKER - AIRLOCK - CONTINUOUS

Zara suits up in a high-tech EVA suit. MECHANIC JO (50s), built like a tank, hands her equipment.

JO
You sure about this, Captain? No one's ever cracked a Sphere before.

ZARA
(smiling)
There's a first time for everything.

She seals her helmet and steps into the airlock.

INT. DYSON SPHERE - MAINTENANCE TUNNEL - NIGHT

Zara floats through zero gravity, her suit lights cutting through darkness. She reaches a massive ENERGY CONDUIT pulsing with golden light.

Suddenly, a VOICE echoes through the tunnel - not mechanical, but organic, ancient.

THE STAR (V.O.)
You have come to steal my light.

Zara freezes, spinning to face the voice.

ZARA
What the hell?

THE STAR (V.O.)
I have waited ten thousand years for someone to hear me. Will you be my thief... or my savior?

Zara stares at the pulsing conduit, her mission complicated by an impossible choice.

FADE OUT.

THE END`;

  const { data: draft, error: draftError } = await supabase
    .from('script_drafts')
    .insert({
      script_id: script.id,
      title: 'First Draft',
      content: screenplay,
      order_index: 0
    })
    .select()
    .single();
  
  if (draftError) {
    console.error('✗ Draft creation failed:', draftError.message);
    return;
  }
  
  console.log('✓ Draft created:', draft.title);
  console.log('  Draft ID:', draft.id);
  console.log('  Content length:', screenplay.length, 'characters');
  
  console.log('\n=== SUCCESS ===');
  console.log('Script: The Galactic Heist');
  console.log('Steps: Logline, Synopsis, Characters');
  console.log('Draft: First Draft (3+ pages)');
  console.log('\nView at: https://clawscreenwriter-frontend-production.up.railway.app/');
  console.log('Login: Crossworkspictures@gmail.com / OpenClaw@1234');
}

createTestScript().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
