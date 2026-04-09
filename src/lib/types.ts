export interface Portal {
	key: string;
	title: string;
	description: string;
	icon: string;
	image: string;
	category: string;
}

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	crisis?: boolean;
}

export interface CreateDiaryRequestBody {
	text: string;
	mood?: string | null;
	tags?: string[] | null;
	image_url?: string | null;
}

export interface DiaryRecord {
	id: string;
	user_id: string;
	text: string;
	mood: string | null;
	tags: string[] | null;
	image_url: string | null;
	created_at: string;
}

export interface CreateDiarySuccessResponse {
	success: true;
	diary: DiaryRecord;
}

export interface CreateDiaryErrorResponse {
	success: false;
	error: string;
}

export interface UpdateDiaryRequestBody {
	id: string;
	text: string;
	mood?: string | null;
	tags?: string[] | null;
	image_url?: string | null;
}

export interface UpdateDiarySuccessResponse {
	success: true;
	diary: DiaryRecord;
}

export interface UpdateDiaryErrorResponse {
	success: false;
	error: string;
}

export interface DeleteDiaryRequestBody {
	id: string;
}

export interface DeleteDiarySuccessResponse {
	success: true;
}

export interface DeleteDiaryErrorResponse {
	success: false;
	error: string;
}

export interface DeleteAccountSuccessResponse {
	success: true;
}

export interface DeleteAccountErrorResponse {
	success: false;
	error: string;
}

export interface DiaryStatsTimelinePoint {
	date: string;
	mood: string;
}

export interface DiaryStatsTimelineSuccessResponse {
	success: true;
	data: DiaryStatsTimelinePoint[];
}

export interface DiaryStatsTimelineErrorResponse {
	success: false;
	error: string;
}

export interface CommunityPostRecord {
	id: string;
	user_id: string;
	diary_entry_id: string;
	content: string;
	mood: string | null;
	created_at: string;
	deleted_at: string | null;
}

export interface CreateCommunityShareRequestBody {
	diaryEntryId: string;
}

export interface CreateCommunityShareSuccessResponse {
	success: true;
	share: CommunityPostRecord;
}

export interface CreateCommunityShareErrorResponse {
	success: false;
	error: string;
	alreadyShared?: boolean;
}

export interface CommunityMySharesSuccessResponse {
	success: true;
	diaryEntryIds: string[];
}

export interface CommunityMySharesErrorResponse {
	success: false;
	error: string;
}

export interface CreateCommunityUnshareRequestBody {
	diaryEntryId: string;
}

export interface CreateCommunityUnshareSuccessResponse {
	success: true;
}

export interface CreateCommunityUnshareErrorResponse {
	success: false;
	error: string;
	alreadyUnshared?: boolean;
}

export interface CommunityCommentRecord {
	id: string;
	post_id: string;
	user_id: string;
	body: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface CreateCommunityCommentRequestBody {
	postId: string;
	body: string;
}

export interface CreateCommunityCommentSuccessResponse {
	success: true;
	comment: Pick<CommunityCommentRecord, 'id' | 'post_id' | 'body' | 'created_at'>;
}

export interface CreateCommunityCommentErrorResponse {
	success: false;
	error: string;
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export interface ForumCategoryRecord {
	id: string;
	name: string;
	description: string;
	icon: string;
	sort_order: number;
	created_at: string;
}

export interface ForumThreadRecord {
	id: string;
	category_id: string;
	user_id: string | null;
	title: string;
	body: string;
	is_anonymous: boolean;
	display_name: string | null;
	reply_count: number;
	last_reply_at: string;
	is_hidden: boolean;
	is_pinned: boolean;
	deleted_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ForumReplyRecord {
	id: string;
	thread_id: string;
	user_id: string | null;
	body: string;
	is_anonymous: boolean;
	display_name: string | null;
	is_hidden: boolean;
	deleted_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ForumReportRecord {
	id: string;
	reporter_id: string | null;
	thread_id: string | null;
	reply_id: string | null;
	reason: string;
	details: string | null;
	resolved_at: string | null;
	created_at: string;
}

// Forum API request/response types

export interface CreateForumReplyRequestBody {
	threadId: string;
	body: string;
	isAnonymous: boolean;
}

export interface CreateForumReplySuccessResponse {
	success: true;
	reply: Pick<ForumReplyRecord, 'id' | 'thread_id' | 'body' | 'is_anonymous' | 'display_name' | 'created_at' | 'updated_at'>;
}

export interface CreateForumReplyErrorResponse {
	success: false;
	error: string;
}

export interface UpdateForumReplyRequestBody {
	id: string;
	body: string;
}

export interface UpdateForumReplySuccessResponse {
	success: true;
	reply: Pick<ForumReplyRecord, 'id' | 'body' | 'updated_at'>;
}

export interface UpdateForumReplyErrorResponse {
	success: false;
	error: string;
}

export interface DeleteForumReplyRequestBody {
	id: string;
}

export interface DeleteForumReplySuccessResponse {
	success: true;
}

export interface DeleteForumReplyErrorResponse {
	success: false;
	error: string;
}

export interface UpdateForumThreadRequestBody {
	id: string;
	title: string;
	body: string;
}

export interface UpdateForumThreadSuccessResponse {
	success: true;
	thread: Pick<ForumThreadRecord, 'id' | 'title' | 'body' | 'updated_at'>;
}

export interface UpdateForumThreadErrorResponse {
	success: false;
	error: string;
}

export interface DeleteForumThreadRequestBody {
	id: string;
}

export interface DeleteForumThreadSuccessResponse {
	success: true;
}

export interface DeleteForumThreadErrorResponse {
	success: false;
	error: string;
}

export type ForumReportReason = 'offensive' | 'spam' | 'crisis' | 'misinformation' | 'other';

export interface CreateForumReportRequestBody {
	threadId?: string;
	replyId?: string;
	reason: ForumReportReason;
	details?: string;
}

export interface CreateForumReportSuccessResponse {
	success: true;
}

export interface CreateForumReportErrorResponse {
	success: false;
	error: string;
}
