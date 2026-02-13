/**
 * Community Forum Page
 *
 * Contract-aligned community feed with working post/comment/like actions.
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CommunityComment, CommunityPost } from '@/types';

export default function CommunityPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [likeLoadingByPost, setLikeLoadingByPost] = useState<Record<string, boolean>>({});

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'general' | 'question' | 'experience' | 'advice'>(
    'general'
  );
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [postingCommentByPost, setPostingCommentByPost] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/community/posts?limit=50');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch posts');
      }

      setPosts(data.posts || []);
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : 'Failed to load community feed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setCommentsLoading((prev) => ({ ...prev, [postId]: true }));

      const response = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load comments');
      }

      setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : 'Failed to load comments';
      setError(errorMessage);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const togglePostExpansion = async (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
      return;
    }

    setSelectedPost(postId);
    if (!comments[postId]) {
      await fetchComments(postId);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.name || user.email.split('@')[0],
          userEmail: user.email,
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          category: newPostCategory,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create post');
      }

      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCategory('general');
      setShowCreatePost(false);
      await fetchPosts();
    } catch (postError) {
      const errorMessage = postError instanceof Error ? postError.message : 'Failed to create post';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (post: CommunityPost) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const postId = post.id;
    if (!postId) return;

    const currentlyLiked = Array.isArray(post.likedBy) && post.likedBy.includes(user.uid);

    setLikeLoadingByPost((prev) => ({ ...prev, [postId]: true }));

    // Optimistic update
    setPosts((prev) =>
      prev.map((item) => {
        if (item.id !== postId) return item;

        return {
          ...item,
          likes: currentlyLiked ? Math.max((item.likes || 0) - 1, 0) : (item.likes || 0) + 1,
          likedBy: currentlyLiked
            ? (item.likedBy || []).filter((id) => id !== user.uid)
            : [...(item.likedBy || []), user.uid],
        };
      })
    );

    try {
      const response = await fetch('/api/community/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'post',
          targetId: postId,
          userId: user.uid,
          isLiked: currentlyLiked,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update like');
      }
    } catch (likeError) {
      // Revert optimistic update on failure.
      setPosts((prev) =>
        prev.map((item) => {
          if (item.id !== postId) return item;

          return {
            ...item,
            likes: post.likes,
            likedBy: post.likedBy,
          };
        })
      );

      const errorMessage = likeError instanceof Error ? likeError.message : 'Failed to update like';
      setError(errorMessage);
    } finally {
      setLikeLoadingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const text = (commentText[postId] || '').trim();
    if (!text) return;

    setPostingCommentByPost((prev) => ({ ...prev, [postId]: true }));
    setError(null);

    try {
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: user.uid,
          userName: user.name || user.email.split('@')[0],
          content: text,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create comment');
      }

      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      await Promise.all([fetchComments(postId), fetchPosts()]);
    } catch (commentError) {
      const errorMessage =
        commentError instanceof Error ? commentError.message : 'Failed to create comment';
      setError(errorMessage);
    } finally {
      setPostingCommentByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatDate = (dateValue: Date | string) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center">
        <LoadingSpinner size="lg" text="Loading community feed..." />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen pt-20 pb-12">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Community Forum</h1>
            <p className="text-neutral-500">Connect with farmers and share field learnings.</p>
          </div>

          <Button
            onClick={() =>
              isAuthenticated ? setShowCreatePost((prev) => !prev) : router.push('/login')
            }
            className="rounded-full shadow-lg"
          >
            {showCreatePost ? 'Cancel' : 'New Post'}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl border border-red-100 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {showCreatePost && (
          <div className="mb-8 animate-slide-up">
            <Card className="p-6 border-2 border-primary-500 shadow-xl">
              <h2 className="text-xl font-bold mb-4">Create New Discussion</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <input
                  className="w-full text-lg font-bold border-b border-neutral-200 py-2 focus:border-primary-500 outline-none"
                  placeholder="Title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
                <textarea
                  className="w-full h-32 resize-none bg-neutral-50 p-4 rounded-xl border border-neutral-200 outline-none"
                  placeholder="Share your question or experience"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <select
                    value={newPostCategory}
                    onChange={(e) =>
                      setNewPostCategory(
                        e.target.value as 'general' | 'question' | 'experience' | 'advice'
                      )
                    }
                    className="bg-neutral-100 rounded-full px-4 py-2 text-sm font-medium outline-none"
                  >
                    <option value="general">General</option>
                    <option value="question">Question</option>
                    <option value="experience">Experience</option>
                    <option value="advice">Advice</option>
                  </select>
                  <Button type="submit" disabled={submitting} size="sm">
                    {submitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 bg-white rounded-2xl border border-neutral-200">
                No posts yet. Start the first discussion.
              </div>
            ) : (
              posts.map((post) => {
                const postId = post.id || '';
                const postComments = postId ? comments[postId] || [] : [];
                const isExpanded = selectedPost === postId;
                const likeLoading = postId ? Boolean(likeLoadingByPost[postId]) : false;
                const commentSubmitting = postId ? Boolean(postingCommentByPost[postId]) : false;
                const postCommentsLoading = postId ? Boolean(commentsLoading[postId]) : false;
                const currentUserId = user?.uid || '';
                const likedByCurrentUser =
                  Boolean(currentUserId) && Array.isArray(post.likedBy)
                    ? post.likedBy.includes(currentUserId)
                    : false;

                return (
                  <Card
                    key={postId}
                    className="p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                          {post.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 text-sm">{post.userName}</h3>
                          <p className="text-xs text-neutral-500">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>

                      <span className="text-xs font-bold bg-neutral-100 px-2 py-1 rounded text-neutral-500 uppercase">
                        {post.category || 'general'}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-neutral-800 mb-2">{post.title}</h2>
                    <p className="text-neutral-600 leading-relaxed mb-4">{post.content}</p>

                    <div className="flex items-center gap-4 text-sm text-neutral-500 border-t border-neutral-100 pt-3">
                      <button
                        onClick={() => handleLikePost(post)}
                        disabled={likeLoading || !postId}
                        className={`flex items-center gap-1 transition-colors ${
                          likedByCurrentUser ? 'text-red-600' : 'hover:text-red-500'
                        }`}
                      >
                        <span>{likedByCurrentUser ? '♥' : '♡'}</span>
                        <span>{post.likes || 0}</span>
                      </button>

                      <button
                        onClick={() => postId && togglePostExpansion(postId)}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        disabled={!postId}
                      >
                        <span>Comments</span>
                        <span>{post.commentCount || 0}</span>
                      </button>
                    </div>

                    {isExpanded && postId && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                        {postCommentsLoading ? (
                          <p className="text-sm text-neutral-500">Loading comments...</p>
                        ) : (
                          <>
                            {postComments.length > 0 ? (
                              <div className="space-y-2">
                                {postComments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="bg-neutral-50 border border-neutral-100 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                                      <span className="font-semibold text-neutral-700">{comment.userName}</span>
                                      <span>{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-neutral-700">{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">No comments yet.</p>
                            )}
                          </>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText[postId] || ''}
                            onChange={(e) =>
                              setCommentText((prev) => ({ ...prev, [postId]: e.target.value }))
                            }
                            placeholder="Write a comment"
                            className="flex-1 p-2.5 border border-neutral-200 rounded-lg text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateComment(postId)}
                            disabled={commentSubmitting || !(commentText[postId] || '').trim()}
                          >
                            {commentSubmitting ? 'Posting...' : 'Comment'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          <div className="hidden lg:block space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-500 text-white border-none">
              <h3 className="font-bold text-xl mb-2">Community Rules</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li>Be respectful to other farmers</li>
                <li>Share verifiable field information</li>
                <li>Avoid spam and promotions</li>
              </ul>
            </Card>

            <Card className="p-6 sticky top-24">
              <h3 className="font-bold text-neutral-900 mb-4">Suggested Topics</h3>
              <div className="flex flex-wrap gap-2">
                {['wheat', 'organic', 'monsoon', 'pest-control', 'market-rates'].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-neutral-100 px-3 py-1 rounded-full text-neutral-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
