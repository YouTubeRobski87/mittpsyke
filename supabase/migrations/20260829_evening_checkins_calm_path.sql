-- Kvällslugn fick temat 'feeling_okay' och en egen parkeringsuppsättning för en
-- kväll som inte bär på något att hantera. CHECK-villkoren från 20260812 kände
-- bara till de ursprungliga värdena, så varje sparförsök på den nya vägen föll
-- på SQLSTATE 23514 och användaren fick "Kunde inte spara Kvällslugn just nu."
--
-- Additivt: samtliga tidigare värden ligger kvar oförändrade, så befintliga
-- rader uppfyller de nya villkoren utan omskrivning.

alter table public.evening_checkins
	drop constraint if exists evening_checkins_theme_id_check;

alter table public.evening_checkins
	add constraint evening_checkins_theme_id_check
	check (
		theme_id in (
			'racing_thoughts',
			'body_anxiety',
			'loneliness',
			'tomorrow',
			'feeling_okay',
			'other'
		)
	);

alter table public.evening_checkins
	drop constraint if exists evening_checkins_parking_bucket_check;

-- Båda uppsättningarna tillåts i kolumnen. Vilken som hör till vilket tema
-- avgörs i validateEveningCheckinInput, inte här - ett CHECK-villkor över två
-- kolumner hade blivit svårare att utöka än nyttan motiverar.
alter table public.evening_checkins
	add constraint evening_checkins_parking_bucket_check
	check (
		parking_bucket in (
			'tomorrow',
			'small_step',
			'not_tonight',
			'let_it_be',
			'carry_it',
			'take_it_easy'
		)
	);
