// Dispatches each timeline item to the right content component.
// Add new content types by importing the component and adding it
// to the RENDERERS map — no other wiring required.

import React from 'react';
import BrandingSlide      from './content/BrandingSlide.jsx';
import LiveClassBoard     from './content/LiveClassBoard.jsx';
import FacultySchedule    from './content/FacultySchedule.jsx';
import AttendanceSummary  from './content/AttendanceSummary.jsx';
import Testimonials       from './content/Testimonials.jsx';
import Toppers            from './content/Toppers.jsx';
import Countdown          from './content/Countdown.jsx';
import EmergencySlide     from './content/EmergencySlide.jsx';
import AiHighlights       from './content/AiHighlights.jsx';
import VideoLoop          from './content/VideoLoop.jsx';
import Poster             from './content/Poster.jsx';
import SimpleText         from './content/SimpleText.jsx';

const RENDERERS = {
  BRANDING:         BrandingSlide,
  SIMPLE_TEXT:      SimpleText,
  LIVE_CLASSES:     LiveClassBoard,
  FACULTY_SCHEDULE: FacultySchedule,
  ATTENDANCE:       AttendanceSummary,
  TESTIMONIALS:     Testimonials,
  TOPPERS:          Toppers,
  COUNTDOWN:        Countdown,
  EMERGENCY:        EmergencySlide,
  AI_HIGHLIGHTS:    AiHighlights,
  VIDEO:            VideoLoop,
  POSTER:           Poster,
  // CHECKIN_FEED is an overlay, not a slide — handled in <CheckinOverlay/>.
};

export default function ContentRenderer({ item, screen }) {
  const Comp = RENDERERS[item.content_type];
  if (!Comp) {
    return (
      <div className="kiosk-hero" style={{ background: '#1f2937' }}>
        <h2 className="kiosk-h2">Unsupported content type</h2>
        <h1 className="kiosk-h1">{item.content_type}</h1>
      </div>
    );
  }
  return <Comp item={item} data={item.data || {}} screen={screen} />;
}
