/**
 * 💬 Chat Response Parser - Parse AI responses with rich content
 * 
 * @author JK & Hero Nexus AI
 * @description Extracts and normalizes rich content from AI responses
 */

/**
 * Parse rich content from AI response
 * @param {object} responseData - Response from chatApi.sendManagerAIMessage
 * @returns {object} Parsed content with normalized structure
 */
export const parseRichContent = (responseData) => {
  if (!responseData) {
    return {
      answer: '',
      shouldContinue: false,
      richContent: { images: [], videos: [], links: [] },
      musicData: null,
      youtubeData: null,
      generatedContent: null,
      identityEvolution: null,
      identityDraftPending: null,
      wantToAsk: null, // 💭 NEW (2026-01-28): Persona's curiosity
    };
  }

  const {
    answer = '',
    continue_conversation = false,
    rich_content = { images: [], videos: [], links: [] },
    music = null,
    youtube = null,
    generated_content = null,
    identity_evolution = null,
    identity_draft_pending = null,
    want_to_ask = null, // 💭 NEW (2026-01-28): Persona's question
  } = responseData;

  // Normalize rich content
  const richContent = {
    images: rich_content.images || [],
    videos: rich_content.videos || [],
    links: rich_content.links || [],
  };

  // Parse generated content (Pixabay image)
  let generatedImage = null;
  if (generated_content?.content_id && generated_content?.content_url) {
    generatedImage = {
      url: generated_content.content_url,
      description: generated_content.metadata?.photographer 
        ? `📷 Photo by ${generated_content.metadata.photographer}` 
        : '🎨 AI Generated Image',
      source: 'pixabay',
      credit: generated_content.metadata?.pageURL || null,
    };
    
    // Add to rich content
    richContent.images = [...richContent.images, generatedImage];
  }

  // Parse music data
  let musicForBubble = null;
  if (music?.track) {
    musicForBubble = {
      id: music.track.id || `track-${Date.now()}`,
      title: music.track.title,
      artist: music.track.artist,
      url: music.track.url,
      duration: music.track.duration,
      image: music.track.image,
      source: music.track.source || 'jamendo',
    };
  }

  // Parse YouTube data
  let youtubeForBubble = null;
  if (youtube?.videoId) {
    youtubeForBubble = {
      videoId: youtube.videoId,
      title: youtube.title,
      channel: youtube.channel,
      thumbnail: youtube.thumbnail,
      url: youtube.url,
      embedUrl: youtube.embedUrl,
    };
  }

  return {
    answer,
    shouldContinue: continue_conversation,
    richContent,
    musicData: musicForBubble,
    youtubeData: youtubeForBubble,
    generatedContent: generated_content,
    identityEvolution: identity_evolution,
    identityDraftPending: identity_draft_pending,
    wantToAsk: want_to_ask, // 💭 NEW (2026-01-28): Persona's curiosity
  };
};

/**
 * Check if content has rich media
 * @param {object} parsedContent - Parsed content from parseRichContent
 * @returns {boolean}
 */
export const hasRichMedia = (parsedContent) => {
  if (!parsedContent) return false;

  const { richContent, musicData, youtubeData } = parsedContent;

  return (
    (richContent.images && richContent.images.length > 0) ||
    (richContent.videos && richContent.videos.length > 0) ||
    (richContent.links && richContent.links.length > 0) ||
    musicData !== null ||
    youtubeData !== null
  );
};

/**
 * Get rich content summary for logging
 * @param {object} parsedContent - Parsed content from parseRichContent
 * @returns {string}
 */
export const getRichContentSummary = (parsedContent) => {
  if (!parsedContent) return 'No rich content';

  const { richContent, musicData, youtubeData } = parsedContent;
  const parts = [];

  if (richContent.images?.length > 0) {
    parts.push(`${richContent.images.length} image(s)`);
  }
  if (richContent.videos?.length > 0) {
    parts.push(`${richContent.videos.length} video(s)`);
  }
  if (richContent.links?.length > 0) {
    parts.push(`${richContent.links.length} link(s)`);
  }
  if (musicData) {
    parts.push('music');
  }
  if (youtubeData) {
    parts.push('youtube');
  }

  return parts.length > 0 ? parts.join(', ') : 'No rich content';
};

