import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Popover,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Send,
  SentimentSatisfiedAlt,
} from '@mui/icons-material';

const POPULAR_EMOJIS = [
  '😀', '😂', '😍', '🔥', '👍', '🎉',
  '❤️', '🚀', '✨', '👋', '😎', '🙏',
  '🙌', '💯', '🤔', '💪', '🥳', '👀',
];

export const MessageInput = ({ onSendMessage, onTyping, onStopTyping, disabled = false }) => {
  const [content, setContent] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (e) => {
    setContent(e.target.value);

    // Trigger typing event
    if (onTyping) {
      onTyping();
    }

    // Debounce stop typing event
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) {
        onStopTyping();
      }
    }, 1500);
  };

  const handleSend = () => {
    if (!content.trim() || disabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onStopTyping) {
      onStopTyping();
    }

    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setEmojiAnchor(null);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* Emoji Picker Button */}
      <Tooltip title="Add Emoji">
        <IconButton
          onClick={(e) => setEmojiAnchor(e.currentTarget)}
          size="medium"
          sx={{ mb: 0.5, color: 'text.secondary' }}
        >
          <SentimentSatisfiedAlt />
        </IconButton>
      </Tooltip>

      {/* Emoji Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: {
            p: 1.5,
            width: 250,
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          },
        }}
      >
        <Grid container spacing={1}>
          {POPULAR_EMOJIS.map((emoji) => (
            <Grid item xs={3} key={emoji} sx={{ textAlign: 'center' }}>
              <Box
                component="button"
                onClick={() => addEmoji(emoji)}
                sx={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  p: 0.8,
                  borderRadius: 2,
                  transition: 'transform 0.1s',
                  '&:hover': {
                    transform: 'scale(1.25)',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {emoji}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Popover>

      {/* Text Field */}
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message... (Press Enter to send)"
        value={content}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            py: 1,
            px: 1.5,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
          },
        }}
      />

      {/* Send Button */}
      <Tooltip title="Send Message">
        <span>
          <IconButton
            onClick={handleSend}
            disabled={!content.trim() || disabled}
            sx={{
              mb: 0.5,
              width: 44,
              height: 44,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
                boxShadow: 'none',
              },
            }}
          >
            <Send fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default MessageInput;
