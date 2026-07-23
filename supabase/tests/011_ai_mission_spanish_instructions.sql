begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(5);

create temporary table mission_config_fixture (
  config jsonb not null
);

insert into mission_config_fixture (config)
values (
  pg_catalog.jsonb_build_object(
    'missionTitle', 'Safe mission',
    'missionLabel', 'Mission',
    'cefrLevel', 'A1',
    'goal', 'Practise a sound.',
    'estimatedMinutes', 5,
    'primarySoundLabel', 'short i',
    'primarySoundIpa', '/i/',
    'secondarySoundLabel', '',
    'secondarySoundIpa', '',
    'primaryWords', pg_catalog.jsonb_build_array('ship'),
    'secondaryWords', '[]'::jsonb,
    'sentences', pg_catalog.jsonb_build_array('The ship is big.'),
    'readingText', 'The ship is big.',
    'supportedTools', pg_catalog.jsonb_build_array('ChatGPT'),
    'promptLanguage', 'English',
    'feedbackLanguage', 'English',
    'difficultyLabel', 'Beginner',
    'resultFormatVersion', 1,
    'teacherInstructions', 'Guide the learner.',
    'studentInstructions', 'Follow these steps.'
  )
);

select ok(
  public.is_valid_ai_speaking_mission_config(config),
  'publication validation accepts an existing mission without Spanish instructions'
)
from mission_config_fixture;

select ok(
  public.is_valid_ai_speaking_mission_config(
    config || pg_catalog.jsonb_build_object(
      'studentInstructionsEs', 'Sigue estos pasos.'
    )
  ),
  'publication validation accepts valid Spanish instructions'
)
from mission_config_fixture;

select not_ok(
  public.is_valid_ai_speaking_mission_config(
    config || pg_catalog.jsonb_build_object(
      'studentInstructionsEs', '   '
    )
  ),
  'publication validation rejects whitespace-only Spanish instructions'
)
from mission_config_fixture;

select not_ok(
  public.is_valid_ai_speaking_mission_config(
    config || pg_catalog.jsonb_build_object(
      'studentInstructionsEs', 42
    )
  ),
  'publication validation rejects a non-text Spanish field'
)
from mission_config_fixture;

select not_ok(
  public.is_valid_ai_speaking_mission_config(
    config || pg_catalog.jsonb_build_object(
      'studentInstructionsEs', pg_catalog.repeat('x', 5001)
    )
  ),
  'publication validation rejects oversized Spanish instructions'
)
from mission_config_fixture;

select * from finish();

rollback;
