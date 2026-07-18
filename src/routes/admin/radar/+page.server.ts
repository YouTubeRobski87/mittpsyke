import { fail, redirect } from '@sveltejs/kit';
import { createServiceClient, isMissingTableError, isUuid } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

type RadarStatus = 'new' | 'reviewed' | 'approved' | 'ignored' | 'article_idea' | 'development_task';

const RADAR_STATUSES: RadarStatus[] = [
	'new',
	'reviewed',
	'approved',
	'ignored',
	'article_idea',
	'development_task'
];

const