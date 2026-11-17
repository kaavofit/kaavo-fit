export type Cat =
  | 'Home' | 'Chest' | 'Shoulder' | 'Biceps' | 'Triceps' | 'Back' | 'Legs' | 'Abs'
  | 'Kegel' | 'Stretch' | 'Yoga';

export type Group = 'Home' | 'Gym' | 'Kegel' | 'Stretch' | 'Yoga';

export type Item = {
  id: string;
  name: string;
  cat: Cat;
  group: Group;
  equip: string;
  muscles: string[];
  tips: string[];
  anim?: string; // id of an existing 3D animation in Trainer3D EXS (if any)
};

const GYM_CATS: Cat[] = ['Chest', 'Shoulder', 'Biceps', 'Triceps', 'Back', 'Legs', 'Abs'];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const e = (
  cat: Cat, name: string, equip: string, muscles: string, t1: string, t2: string, anim?: string
): Item => ({
  id: slug(cat + '-' + name),
  name,
  cat,
  group: GYM_CATS.includes(cat) ? 'Gym' : (cat as Group),
  equip,
  muscles: muscles.split(','),
  tips: [t1, t2],
  anim,
});

export const EXERCISES: Item[] = [
  // ---------- HOME (20) ----------
  e('Home', 'Push-ups', 'Bodyweight', 'Chest,Triceps,Core', 'Keep your body in one straight line from head to heels.', 'Lower until your chest is near the floor, elbows about 45 degrees.', 'pushup'),
  e('Home', 'Wide Push-ups', 'Bodyweight', 'Chest,Shoulders', 'Hands wider than shoulders, wrists under hands.', 'Do not let your hips sag.'),
  e('Home', 'Diamond Push-ups', 'Bodyweight', 'Triceps,Chest', 'Make a diamond with thumbs and index fingers under your chest.', 'Keep elbows close to your body.'),
  e('Home', 'Pike Push-ups', 'Bodyweight', 'Shoulders,Triceps', 'Hips high so your body forms an upside-down V.', 'Lower the top of your head toward the floor between your hands.'),
  e('Home', 'Chair Dips', 'Chair', 'Triceps,Chest', 'Use a stable chair and keep hands beside your hips.', 'Lower until elbows reach about 90 degrees, back close to the chair.'),
  e('Home', 'Pull-ups', 'Pull-up bar', 'Lats,Biceps,Upper back', 'Start from a full hang with shoulders pulled down.', 'Pull your chin over the bar without swinging.'),
  e('Home', 'Squats', 'Bodyweight', 'Quads,Glutes,Hamstrings', 'Feet shoulder width apart, chest up.', 'Knees track over toes, push through your heels.', 'squat'),
  e('Home', 'Lunges', 'Bodyweight', 'Quads,Glutes', 'Take a long step and drop the back knee toward the floor.', 'Front knee stays above the ankle.', 'lunge'),
  e('Home', 'Jump Squats', 'Bodyweight', 'Quads,Glutes,Calves', 'Squat down, then jump straight up.', 'Land softly with knees bent.'),
  e('Home', 'Glute Bridge', 'Bodyweight', 'Glutes,Hamstrings', 'Feet flat, knees bent, drive your hips up.', 'Squeeze glutes at the top without over-arching your lower back.', 'bridge'),
  e('Home', 'Calf Raises', 'Bodyweight', 'Calves', 'Rise slowly onto your toes.', 'Lower under control for a full stretch.'),
  e('Home', 'Wall Sit', 'Wall', 'Quads,Glutes', 'Back flat on the wall, thighs parallel to the floor.', 'Knees stay above your ankles.'),
  e('Home', 'Crunches', 'Bodyweight', 'Abs', 'Lift your shoulders, not your neck.', 'Keep your lower back on the floor.'),
  e('Home', 'Reverse Crunch', 'Bodyweight', 'Lower abs', 'Curl your hips toward your chest.', 'Move slowly, do not swing your legs.'),
  e('Home', 'Plank', 'Bodyweight', 'Core,Shoulders', 'Elbows under shoulders, body in a straight line.', 'Squeeze abs and glutes and keep breathing.', 'plank'),
  e('Home', 'Bicycle Crunch', 'Bodyweight', 'Abs,Obliques', 'Rotate your shoulder toward the opposite knee.', 'Keep the pace slow and controlled.'),
  e('Home', 'Mountain Climbers', 'Bodyweight', 'Core,Shoulders,Legs', 'Start in a high plank position.', 'Drive knees toward your chest, hips stay level.'),
  e('Home', 'Leg Raises', 'Bodyweight', 'Lower abs,Hip flexors', 'Press your lower back into the floor.', 'Lower legs slowly and stop before your back arches.'),
  e('Home', 'Superman', 'Bodyweight', 'Lower back,Glutes', 'Lift arms and legs together.', 'Keep your neck neutral and look at the floor.'),
  e('Home', 'Bird Dog', 'Bodyweight', 'Core,Lower back,Glutes', 'Reach the opposite arm and leg out long.', 'Keep hips square and do not rotate.'),

  // ---------- GYM: CHEST (10) ----------
  e('Chest', 'Bench Press', 'Barbell', 'Chest,Triceps,Shoulders', 'Feet flat and shoulder blades pinched on the bench.', 'Lower the bar to mid chest. Use a spotter for heavy sets.'),
  e('Chest', 'Incline Bench Press', 'Barbell', 'Upper chest,Shoulders,Triceps', 'Set the bench at about 30 degrees.', 'Lower the bar to your upper chest.'),
  e('Chest', 'Chest Press', 'Machine', 'Chest,Triceps', 'Adjust the seat so handles are at mid chest.', 'Press forward without locking your elbows hard.'),
  e('Chest', 'Dumbbell Press', 'Dumbbells', 'Chest,Triceps,Shoulders', 'Lower dumbbells beside your chest.', 'Press up and slightly in, wrists stacked over elbows.'),
  e('Chest', 'Pec Deck Fly', 'Machine', 'Chest', 'Keep your chest up and shoulders back.', 'Bring the handles together with a small elbow bend.'),
  e('Chest', 'Cable Crossover', 'Cable', 'Chest', 'Lean slightly forward with a small elbow bend.', 'Bring hands together in front of your lower chest.'),
  e('Chest', 'Incline Fly', 'Dumbbells', 'Upper chest', 'Keep a slight elbow bend throughout.', 'Open until you feel a chest stretch, not further.'),
  e('Chest', 'Decline Press', 'Barbell', 'Lower chest,Triceps', 'Secure your legs on the pad.', 'Lower to the lower chest and control the bar.'),
  e('Chest', 'Weighted Dips', 'Dip bars,Belt', 'Chest,Triceps', 'Lean forward slightly for chest focus.', 'Lower until upper arms are about parallel to the floor.'),
  e('Chest', 'Dumbbell Pullover', 'Dumbbell', 'Chest,Lats', 'Hold one dumbbell with both hands over your chest.', 'Lower behind your head with soft elbows, then pull back.'),

  // ---------- GYM: SHOULDER (10) ----------
  e('Shoulder', 'Shoulder Press', 'Dumbbells', 'Shoulders,Triceps', 'Keep your core tight and ribs down.', 'Press overhead without arching your back.', 'press'),
  e('Shoulder', 'Dumbbell Press', 'Dumbbells', 'Shoulders,Triceps', 'Start with dumbbells at ear height.', 'Press up until arms are straight without locking hard.', 'press'),
  e('Shoulder', 'Lateral Raises', 'Dumbbells', 'Side delts', 'Lift to shoulder height with slightly bent elbows.', 'No swinging, lower slowly.', 'lateral'),
  e('Shoulder', 'Front Raises', 'Dumbbells', 'Front delts', 'Lift to shoulder height with straight arms.', 'Do not lean back.'),
  e('Shoulder', 'Reverse Pec Deck', 'Machine', 'Rear delts,Upper back', 'Keep your chest against the pad.', 'Pull arms back and squeeze your shoulder blades.'),
  e('Shoulder', 'Face Pulls', 'Cable,Rope', 'Rear delts,Upper back', 'Set the cable at face height.', 'Pull the rope toward your face with elbows high.'),
  e('Shoulder', 'Arnold Press', 'Dumbbells', 'Shoulders', 'Start with palms facing you and rotate as you press.', 'Control the rotation on the way down.'),
  e('Shoulder', 'Upright Row', 'Barbell', 'Shoulders,Traps', 'Pull only to chest height.', 'Keep the bar close to your body with elbows leading.'),
  e('Shoulder', 'Overhead Press', 'Barbell', 'Shoulders,Triceps,Core', 'Start with the bar at your upper chest.', 'Press straight up and move your head through at the top.'),
  e('Shoulder', 'Cable Lateral Raise', 'Cable', 'Side delts', 'Stand sideways to the cable.', 'Lift to shoulder height with no swinging.'),

  // ---------- GYM: BICEPS (10) ----------
  e('Biceps', 'Dumbbell Curl', 'Dumbbells', 'Biceps', 'Keep elbows beside your body.', 'Curl up, then lower slowly.', 'curl'),
  e('Biceps', 'Barbell Curl', 'Barbell', 'Biceps', 'Grip about shoulder width.', 'Do not swing your torso.'),
  e('Biceps', 'Hammer Curl', 'Dumbbells', 'Biceps,Forearms', 'Palms face each other throughout.', 'Keep elbows still.'),
  e('Biceps', 'EZ Bar Curl', 'EZ bar', 'Biceps', 'Hold the angled grips with neutral wrists.', 'Keep elbows at your sides.'),
  e('Biceps', 'Concentration Curl', 'Dumbbell', 'Biceps', 'Rest your elbow against your inner thigh.', 'Curl slowly and squeeze at the top.'),
  e('Biceps', 'Preacher Curl', 'Preacher bench', 'Biceps', 'Keep your upper arms flat on the pad.', 'Do not fully lock out at the bottom.'),
  e('Biceps', 'Incline Curl', 'Dumbbells,Incline bench', 'Biceps', 'Let your arms hang slightly behind your body.', 'Keep your back against the bench.'),
  e('Biceps', 'Cable Curl', 'Cable', 'Biceps', 'Keep elbows fixed at your sides.', 'Keep tension and lower slowly.'),
  e('Biceps', 'Spider Curl', 'Dumbbells,Incline bench', 'Biceps', 'Lie chest-down on an incline bench with arms hanging.', 'Curl without moving your upper arms.'),
  e('Biceps', 'Bayesian Curl', 'Cable', 'Biceps', 'Face away from the cable with your arm behind your body.', 'Curl forward and keep the elbow back.'),

  // ---------- GYM: TRICEPS (10) ----------
  e('Triceps', 'Rope Pushdown', 'Cable,Rope', 'Triceps', 'Pin your elbows to your sides.', 'Spread the rope apart at the bottom.'),
  e('Triceps', 'Bar Pushdown', 'Cable,Bar', 'Triceps', 'Keep your upper arms still.', 'Push down until arms are straight.'),
  e('Triceps', 'Overhead Extension', 'Cable', 'Triceps', 'Elbows point forward, close to your head.', 'Lower behind your head, then extend fully.'),
  e('Triceps', 'Dumbbell Extension', 'Dumbbell', 'Triceps', 'Hold one dumbbell with both hands overhead.', 'Keep your elbows tucked in.'),
  e('Triceps', 'Skull Crushers', 'EZ bar,Bench', 'Triceps', 'Lower the bar toward your forehead or just behind it.', 'Only your elbows bend, upper arms stay still.'),
  e('Triceps', 'Close Grip Bench Press', 'Barbell,Bench', 'Triceps,Chest', 'Hands about shoulder width apart.', 'Keep elbows close to your body.'),
  e('Triceps', 'Single Arm Pushdown', 'Cable', 'Triceps', 'Keep your elbow at your side.', 'Squeeze at the bottom.'),
  e('Triceps', 'Kickback', 'Dumbbell', 'Triceps', 'Hinge forward with your upper arm parallel to the floor.', 'Straighten your arm back without swinging.'),
  e('Triceps', 'Weighted Dips', 'Dip bars,Belt', 'Triceps,Chest', 'Stay more upright for triceps focus.', 'Lower to about 90 degrees at the elbows.'),
  e('Triceps', 'JM Press', 'Barbell,Bench', 'Triceps', 'Keep elbows in and lower the bar toward your chin line.', 'Use light weight and a spotter.'),

  // ---------- GYM: BACK (10) ----------
  e('Back', 'Lat Pulldown', 'Cable machine', 'Lats,Biceps', 'Pull the bar to your upper chest.', 'Lead with your elbows and do not lean back much.'),
  e('Back', 'Seated Cable Row', 'Cable machine', 'Mid back,Lats', 'Keep your chest tall.', 'Pull the handle to your waist and squeeze your shoulder blades.'),
  e('Back', 'Pull-ups', 'Pull-up bar', 'Lats,Biceps', 'Start from a full hang.', 'Pull your chin over the bar without kipping.'),
  e('Back', 'One Arm Dumbbell Row', 'Dumbbell,Bench', 'Lats,Mid back', 'Keep your back flat.', 'Pull your elbow toward your hip and keep your torso still.'),
  e('Back', 'Chest Supported Row', 'Machine', 'Mid back', 'Keep your chest on the pad.', 'Pull elbows back and squeeze.'),
  e('Back', 'T-Bar Row', 'T-bar', 'Mid back,Lats', 'Hinge at the hips with a flat back.', 'Pull toward your lower chest.'),
  e('Back', 'Bent Over Row', 'Barbell', 'Lats,Mid back', 'Hinge forward with a flat back.', 'Pull the bar to your lower ribs.'),
  e('Back', 'Straight Arm Pulldown', 'Cable', 'Lats', 'Lean slightly forward with nearly straight arms.', 'Sweep the bar down to your thighs.'),
  e('Back', 'Weighted Pull-up', 'Pull-up bar,Belt', 'Lats,Biceps', 'Add weight only after clean bodyweight reps.', 'Use full range and no swinging.'),
  e('Back', 'Deadlift', 'Barbell', 'Hamstrings,Glutes,Lower back', 'Bar over mid-foot with a flat back.', 'Push the floor away and lock your hips at the top.', 'deadlift'),

  // ---------- GYM: LEGS (9) ----------
  e('Legs', 'Squat', 'Barbell', 'Quads,Glutes', 'Brace your core and keep your chest up.', 'Squat to parallel or lower with control.', 'squat'),
  e('Legs', 'Leg Press', 'Machine', 'Quads,Glutes', 'Feet shoulder width on the platform.', 'Do not lock your knees or lift your hips.'),
  e('Legs', 'Leg Extension', 'Machine', 'Quads', 'Pad sits on your lower shin.', 'Extend fully and lower slowly.'),
  e('Legs', 'Leg Curl', 'Machine', 'Hamstrings', 'Keep your hips down.', 'Curl smoothly and control the return.'),
  e('Legs', 'Calf Raise', 'Machine', 'Calves', 'Get a full stretch at the bottom.', 'Pause at the top.'),
  e('Legs', 'Lunges', 'Dumbbells', 'Quads,Glutes', 'Take a long step with an upright torso.', 'Push through your front heel.', 'lunge'),
  e('Legs', 'Romanian Deadlift', 'Barbell', 'Hamstrings,Glutes', 'Soft knees, push your hips back.', 'The bar slides along your thighs with a flat back.'),
  e('Legs', 'Bulgarian Split Squat', 'Dumbbells,Bench', 'Quads,Glutes', 'Rest your rear foot on a bench.', 'Front knee over ankle, torso slightly forward.'),
  e('Legs', 'Hack Squat', 'Machine', 'Quads,Glutes', 'Keep your back flat on the pad.', 'Lower with control and drive through your whole foot.'),

  // ---------- GYM: ABS (10) ----------
  e('Abs', 'Cable Crunch', 'Cable,Rope', 'Abs', 'Kneel with the rope by your head.', 'Curl your ribs toward your hips instead of sitting back.'),
  e('Abs', 'Hanging Leg Raise', 'Pull-up bar', 'Lower abs', 'Do not swing.', 'Raise your legs with control.'),
  e('Abs', 'Hanging Knee Raise', 'Pull-up bar', 'Lower abs', 'Curl your pelvis up.', 'Lower slowly.'),
  e('Abs', 'Ab Crunch Machine', 'Machine', 'Abs', 'Keep your hips on the seat.', 'Curl with your abs, do not pull with your arms.'),
  e('Abs', 'Decline Sit-ups', 'Decline bench', 'Abs', 'Cross your arms over your chest.', 'Do not yank your neck.'),
  e('Abs', 'Ab Wheel', 'Ab wheel', 'Abs,Core', 'Brace your core and tuck your pelvis.', 'Roll only as far as you can keep your back flat.'),
  e('Abs', 'Weighted Crunch', 'Weight plate', 'Abs', 'Hold the weight on your chest.', 'Lift your shoulders only.'),
  e('Abs', 'Reverse Crunch', 'Bench', 'Lower abs', 'Curl your hips toward your chest.', 'Move slowly with no swinging.'),
  e('Abs', 'Pallof Press', 'Cable,Band', 'Core,Obliques', 'Stand sideways to the cable.', 'Press out and resist the rotation.'),
  e('Abs', 'Woodchopper', 'Cable', 'Obliques,Core', 'Rotate through your torso, not just your arms.', 'Pivot your back foot.'),

  // ---------- KEGEL (8) ----------
  e('Kegel', 'Basic Kegel', 'None', 'Pelvic floor', 'Gently lift and squeeze the pelvic floor and hold for 3 seconds.', 'Relax fully between reps and keep breathing.', 'kegel-hold'),
  e('Kegel', 'Seated Kegel', 'Chair', 'Pelvic floor', 'Sit tall on a chair with feet flat.', 'Do not tighten your abs, thighs or glutes.', 'kegel-hold'),
  e('Kegel', 'Standing Kegel', 'None', 'Pelvic floor', 'Stand with feet hip width apart.', 'Keep your breathing steady.', 'kegel-hold'),
  e('Kegel', 'Quick Kegels', 'None', 'Pelvic floor', 'Do fast 1-second squeezes.', 'Release fully after each squeeze.', 'kegel-quick'),
  e('Kegel', 'Long Hold Kegel', 'None', 'Pelvic floor', 'Build up slowly to an 8 to 10 second hold.', 'Breathe normally while holding.', 'kegel-hold'),
  e('Kegel', 'Supine Kegel', 'Mat', 'Pelvic floor', 'Lie on your back with knees bent.', 'Keep your hips and glutes relaxed.', 'kegel-hold'),
  e('Kegel', 'Kegel with Glute Bridge', 'Mat', 'Pelvic floor,Glutes', 'Lift your hips while gently squeezing the pelvic floor.', 'Lower slowly and relax.', 'kegel-hold'),
  e('Kegel', 'Relaxation / Reverse Kegel', 'Mat', 'Pelvic floor', 'Breathe deeply and let the pelvic floor soften.', 'Do not push or strain.'),

  // ---------- STRETCH (16) ----------
  e('Stretch', 'Neck Stretch', 'None', 'Neck', 'Tilt your ear gently toward your shoulder.', 'Do not pull hard. Hold 20 to 30 seconds.'),
  e('Stretch', 'Shoulder Stretch', 'None', 'Shoulders', 'Bring one arm across your chest.', 'Keep your shoulder relaxed and down.'),
  e('Stretch', 'Cross Body Stretch', 'None', 'Rear delts', 'Hug your arm across your body at shoulder height.', 'Keep your chest facing forward.'),
  e('Stretch', 'Triceps Stretch', 'None', 'Triceps', 'Raise your elbow with your hand behind your head.', 'Gently press the elbow with your other hand.'),
  e('Stretch', 'Chest Doorway Stretch', 'Doorway', 'Chest', 'Place your forearm on the door frame and step through.', 'Keep your ribs down.'),
  e('Stretch', 'Cat Cow', 'Mat', 'Spine', 'Alternate arching and rounding your back.', 'Move with your breath.'),
  e('Stretch', "Child's Pose", 'Mat', 'Back,Hips', 'Sit your hips back toward your heels.', 'Breathe into your back.'),
  e('Stretch', 'Cobra Stretch', 'Mat', 'Abs,Spine', 'Hands under shoulders, lift your chest.', 'Keep hips on the floor and shoulders away from ears.'),
  e('Stretch', 'Seated Forward Fold', 'Mat', 'Hamstrings,Back', 'Hinge forward from your hips.', 'Keep knees soft and do not force it.'),
  e('Stretch', 'Hamstring Stretch', 'None', 'Hamstrings', 'Place your heel on the floor and hinge forward.', 'Keep your back flat.'),
  e('Stretch', 'Quad Stretch', 'None', 'Quads', 'Pull your heel toward your glute.', 'Keep knees together and stand tall.'),
  e('Stretch', 'Hip Flexor Stretch', 'Mat', 'Hip flexors', 'Kneel in a half-kneeling position and tuck your pelvis.', 'Shift forward gently.'),
  e('Stretch', 'Butterfly Stretch', 'Mat', 'Inner thighs', 'Bring the soles of your feet together.', 'Sit tall and do not push your knees down.'),
  e('Stretch', 'Figure Four Stretch', 'Mat', 'Glutes', 'Cross your ankle over the opposite knee.', 'Gently pull your thigh toward your chest.'),
  e('Stretch', 'Calf Stretch', 'Wall', 'Calves', 'Keep your back heel down and lean forward.', 'Keep your back leg straight.'),
  e('Stretch', 'Downward Dog', 'Mat', 'Hamstrings,Shoulders', 'Lift your hips high and press your heels toward the floor.', 'Keep your spine long. Bend your knees if needed.'),

  // ---------- YOGA (30) ----------
  e('Yoga', 'Mountain Pose', 'Mat', 'Posture', 'Ground your feet and relax your shoulders.', 'Lengthen through the crown of your head.'),
  e('Yoga', 'Tree Pose', 'Mat', 'Balance,Legs', 'Place your foot on your calf or thigh, never on the knee.', 'Fix your gaze on one point.'),
  e('Yoga', 'Chair Pose', 'Mat', 'Quads,Glutes', 'Sit back with knees behind your toes.', 'Reach your arms up and keep your ribs tucked.'),
  e('Yoga', 'Warrior I', 'Mat', 'Legs,Hips', 'Front knee over ankle, back foot angled.', 'Square your hips forward and reach your arms up.'),
  e('Yoga', 'Warrior II', 'Mat', 'Legs,Hips', 'Front knee over ankle, arms parallel to the floor.', 'Keep your torso centered.'),
  e('Yoga', 'Warrior III', 'Mat', 'Balance,Hamstrings', 'Hinge forward and lift your back leg.', 'Keep hips level. A slight knee bend is fine.'),
  e('Yoga', 'Triangle Pose', 'Mat', 'Hamstrings,Obliques', 'Reach long, then hinge over your front leg.', 'Do not collapse your chest forward.'),
  e('Yoga', 'Extended Side Angle', 'Mat', 'Legs,Obliques', 'Rest your forearm on your thigh or your hand on the floor.', 'Open your chest toward the ceiling.'),
  e('Yoga', 'Plank Pose', 'Mat', 'Core,Shoulders', 'Form a straight line from head to heels.', 'Press the floor away.'),
  e('Yoga', 'Cobra Pose', 'Mat', 'Spine', 'Keep elbows slightly bent and hips down.', 'Lift from your chest.'),
  e('Yoga', 'Upward Dog', 'Mat', 'Spine,Shoulders', 'Arms straight, thighs lifted off the floor.', 'Press the tops of your feet down.'),
  e('Yoga', 'Downward Dog', 'Mat', 'Hamstrings,Shoulders', 'Hips high, heels pressing toward the floor.', 'Keep your spine long. Bend your knees if needed.'),
  e('Yoga', "Child's Pose", 'Mat', 'Back,Hips', 'Sit your hips back toward your heels.', 'Rest and breathe slowly.'),
  e('Yoga', 'Cat Pose', 'Mat', 'Spine', 'Round your back and tuck your chin.', 'Press the floor away.'),
  e('Yoga', 'Cow Pose', 'Mat', 'Spine', 'Lift your tailbone and chest.', 'Keep your shoulders away from your ears.'),
  e('Yoga', 'Bridge Pose', 'Mat', 'Glutes,Back', 'Press through your feet to lift your hips.', 'Keep knees over ankles.'),
  e('Yoga', 'Bow Pose', 'Mat', 'Back,Quads', 'Hold your ankles and lift your chest and thighs.', 'Breathe steadily and do not force it.'),
  e('Yoga', 'Camel Pose', 'Mat', 'Chest,Quads', 'Start with your hands on your lower back.', 'Push your hips forward. Advanced pose, go gently.'),
  e('Yoga', 'Boat Pose', 'Mat', 'Core', 'Lean back and lift your legs.', 'Keep your chest open and spine long.'),
  e('Yoga', 'Seated Forward Bend', 'Mat', 'Hamstrings', 'Hinge forward from your hips.', 'Keep your spine long.'),
  e('Yoga', 'Butterfly Pose', 'Mat', 'Hips', 'Bring the soles of your feet together.', 'Sit tall.'),
  e('Yoga', 'Pigeon Pose', 'Mat', 'Hips,Glutes', 'Angle your front shin and extend the back leg long.', 'Square your hips. Use support under your hip if needed.'),
  e('Yoga', 'Garland Pose', 'Mat', 'Hips,Ankles', 'Squat deep and press your elbows against your knees.', 'Keep heels down or place them on a folded mat.'),
  e('Yoga', 'Corpse Pose', 'Mat', 'Relaxation', 'Lie flat with your arms relaxed.', 'Let your breathing become natural.'),
  e('Yoga', 'Lotus Pose', 'Mat', 'Hips', 'Only do this if your hips are open.', 'Never force your knees.'),
  e('Yoga', 'Easy Pose', 'Mat', 'Posture', 'Cross your legs and sit tall.', 'Switch the leg cross each time.'),
  e('Yoga', 'Fish Pose', 'Mat', 'Chest,Neck', 'Lift your chest while resting on your elbows.', 'Keep your neck relaxed and do not drop your head hard.'),
  e('Yoga', 'Locust Pose', 'Mat', 'Back,Glutes', 'Lift your chest and legs together.', 'Gaze down to keep your neck neutral.'),
  e('Yoga', 'Half Spinal Twist', 'Mat', 'Spine', 'Sit tall and twist from your mid-back.', 'Twist on the exhale.'),
  e('Yoga', 'Sun Salutation', 'Mat', 'Full body', 'Flow from pose to pose with your breath.', 'Go slowly as a beginner.'),
];

export const CAT_ORDER: Cat[] = [
  'Home', 'Chest', 'Shoulder', 'Biceps', 'Triceps', 'Back', 'Legs', 'Abs', 'Kegel', 'Stretch', 'Yoga',
];
