export const DIARY_LEAVE_CONTEXT = Symbol('diary-leave');

export interface DiaryLeaveContext {
	readonly logoutPending: boolean;
	confirmLeave?: (leave: () => void) => void;
}
