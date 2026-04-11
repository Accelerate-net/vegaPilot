import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { courseViewDemo } from '../data/courseViewDemo';

function useCourseRouteState() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return {
    courseCode: params.get('courseCode') || courseViewDemo.code,
    segmentId: params.get('segment') || '1',
    moduleId: params.get('module') || '1',
    chapterId: params.get('chapter') || '1',
    partId: params.get('part') || '0',
    bundleId: params.get('bundleId') || '70005',
  };
}

export default function CourseViewPage() {
  const navigate = useNavigate();
  const route = useCourseRouteState();

  const currentSegment = useMemo(
    () => courseViewDemo.segments.find((segment) => segment.id === route.segmentId) || courseViewDemo.segments[0],
    [route.segmentId]
  );
  const currentModule = useMemo(
    () => currentSegment.modules.find((module) => module.id === route.moduleId) || currentSegment.modules[0],
    [currentSegment, route.moduleId]
  );
  const currentChapter = useMemo(
    () => currentModule.chapters.find((chapter) => chapter.id === route.chapterId) || currentModule.chapters[0],
    [currentModule, route.chapterId]
  );
  const currentPart = useMemo(
    () => currentChapter.parts.find((part) => part.id === route.partId) || currentChapter.parts[0],
    [currentChapter, route.partId]
  );

  function navigateTo({ segmentId = currentSegment.id, moduleId = currentModule.id, chapterId = currentChapter.id, partId = currentPart.id }) {
    navigate(`/course-view?courseCode=${route.courseCode}&bundleId=${route.bundleId}&segment=${segmentId}&module=${moduleId}&chapter=${chapterId}&part=${partId}`);
  }

  return (
    <section className="screen-card course-view-page">
      <div className="hero-row">
        <div>
          <p className="eyebrow">Course Viewer</p>
          <h3>{courseViewDemo.title}</h3>
          <p className="muted-copy">{courseViewDemo.description}</p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate('/courses-list')}>Back to Courses</button>
          <button type="button" className="primary-button" onClick={() => navigate('/catalog')}>Catalog</button>
        </div>
      </div>

      <div className="course-layout">
        <aside className="detail-panel course-sidebar-panel">
          <h4>Course Structure</h4>
          {courseViewDemo.segments.map((segment) => (
            <div key={segment.id} className="outline-block">
              <button type="button" className={`outline-trigger ${segment.id === currentSegment.id ? 'active-page' : ''}`} onClick={() => navigateTo({ segmentId: segment.id, moduleId: segment.modules[0].id, chapterId: segment.modules[0].chapters[0].id, partId: segment.modules[0].chapters[0].parts[0].id })}>
                Segment {segment.id}: {segment.title}
              </button>
              {segment.id === currentSegment.id ? (
                <div className="outline-children">
                  {segment.modules.map((module) => (
                    <div key={module.id}>
                      <button type="button" className={`outline-trigger minor ${module.id === currentModule.id ? 'active-page' : ''}`} onClick={() => navigateTo({ segmentId: segment.id, moduleId: module.id, chapterId: module.chapters[0].id, partId: module.chapters[0].parts[0].id })}>
                        {module.name}
                      </button>
                      {module.id === currentModule.id ? (
                        <div className="outline-children">
                          {module.chapters.map((chapter) => (
                            <button key={chapter.id} type="button" className={`outline-trigger tiny ${chapter.id === currentChapter.id ? 'active-page' : ''}`} onClick={() => navigateTo({ segmentId: segment.id, moduleId: module.id, chapterId: chapter.id, partId: chapter.parts[0].id })}>
                              {chapter.name}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </aside>

        <div className="detail-panel course-main-panel">
          <div className="hero-row">
            <div>
              <p className="eyebrow">Now Viewing</p>
              <h4>{currentChapter.name}</h4>
              <p className="muted-copy">{currentChapter.description}</p>
            </div>
            <span className="link-chip neutral">{currentModule.name}</span>
          </div>

          <div className="detail-grid">
            <article className="detail-panel">
              <h4>Current Part</h4>
              <p><strong>{currentPart.title}</strong></p>
              <p className="muted-copy">{currentPart.summary}</p>
              <p><strong>Type:</strong> {currentPart.type}</p>
              <p><strong>Duration:</strong> {currentPart.duration ? `${Math.floor(currentPart.duration / 60)}m ${currentPart.duration % 60}s` : 'Reference material'}</p>
            </article>
            <article className="detail-panel">
              <h4>Course Metadata</h4>
              <p><strong>Course:</strong> {courseViewDemo.title}</p>
              <p><strong>Instructor:</strong> {courseViewDemo.instructor}</p>
              <p><strong>Rating:</strong> {courseViewDemo.rating}</p>
              <p><strong>Students:</strong> {courseViewDemo.totalStudents}</p>
            </article>
          </div>

          <div className="stack-grid">
            <h4>Chapter Parts</h4>
            {currentChapter.parts.map((part) => (
              <button key={part.id} type="button" className={`detail-panel part-card ${part.id === currentPart.id ? 'active-panel' : ''}`} onClick={() => navigateTo({ partId: part.id })}>
                <div className="hero-row">
                  <strong>{part.title}</strong>
                  <span className="student-subtle">{part.type}</span>
                </div>
                <p className="muted-copy">{part.summary}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
