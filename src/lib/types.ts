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
}

export interface DiaryRecord {
	id: string;
	user_id: string;
	text: string;
	mood: string | null;
	tags: string[] | null;
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


