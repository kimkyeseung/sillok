'use client';

import LikeButton from '@/components/thread/LikeButton';
import ReportButton from '@/components/thread/ReportButton';
import NodeCommentForm from '@/components/thread/NodeCommentForm';
import FollowButton from '@/components/person/FollowButton';

interface NodeActionsProps {
  nodeId: string;
  nodeSlug: string;
  followCount: number;
}

export function NodeActions({ nodeId, nodeSlug, followCount }: NodeActionsProps) {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
      <FollowButton targetType="node" targetId={nodeId} initialCount={followCount} />
    </div>
  );
}

interface CommentActionsProps {
  commentId: string;
  likeCount: number;
}

export function CommentActions({ commentId, likeCount }: CommentActionsProps) {
  return (
    <div className="mt-1 flex items-center gap-1 pl-[38px]">
      <LikeButton targetType="node_comment" targetId={commentId} initialCount={likeCount} />
      <ReportButton targetType="node_comment" targetId={commentId} />
    </div>
  );
}

interface CommentFormWrapperProps {
  nodeSlug: string;
}

export function CommentFormWrapper({ nodeSlug }: CommentFormWrapperProps) {
  return (
    <div className="border-t border-gray-100 px-5 py-4">
      <NodeCommentForm nodeSlug={nodeSlug} />
    </div>
  );
}
