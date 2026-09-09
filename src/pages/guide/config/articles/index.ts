import type { GuideArticle } from '../guide';
import { ACCEPT_INVITE_ARTICLE } from './acceptInvite';
import { AUTHOR_VIEW_ARTICLE } from './authorView';
import { INVITE_MEMBERS_ARTICLE } from './inviteMembers';
import { OWNER_AND_MEMBER_ROLES_ARTICLE } from './ownerAndMemberRoles';

export const GUIDE_ARTICLES: GuideArticle[] = [
  INVITE_MEMBERS_ARTICLE,
  ACCEPT_INVITE_ARTICLE,
  OWNER_AND_MEMBER_ROLES_ARTICLE,
  AUTHOR_VIEW_ARTICLE,
].sort((a, b) => a.order - b.order);
