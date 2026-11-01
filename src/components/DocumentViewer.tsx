import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PageTransitionMode, PageLayoutMode, FitMode } from '../types';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const PDFJS_CSS_UNITS = 96 / 72;
const PAGE_SCALE_FACTOR = 0.745;

interface DocumentViewerProps {
  pdfUrl: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ pdfUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerAreaRef = useRef<HTMLDivElement>(null);
  const pageStageRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Viewer options
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [pageMenuOpen, setPageMenuOpen] = useState<boolean>(false);
  const [zoomMenuOpen, setZoomMenuOpen] = useState<boolean>(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState<boolean>(false);

  const [zoom, setZoom] = useState<number>(0.69);
  const [fitMode, setFitMode] = useState<FitMode>('fixed');
  const [transition, setTransition] = useState<PageTransitionMode>('continuous');
  const [layout, setLayout] = useState<PageLayoutMode>('single');
  const [rotation, setRotation] = useState<number>(0);
  const [thumbScale, setThumbScale] = useState<number>(1);
  const [panMode, setPanMode] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Panning drag refs
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const renderTasksRef = useRef<pdfjsLib.RenderTask[]>([]);
  const renderTokenRef = useRef<number>(0);

  // Close menus when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.viewer-popup') && !target.closest('.viewer-toolbar-btn')) {
        setPageMenuOpen(false);
        setZoomMenuOpen(false);
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Normalize rotation to 0, 90, 180, 270
  const normalizedRotation = useCallback((val: number) => {
    return ((val % 360) + 360) % 360;
  }, []);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const fullUrl = pdfUrl.startsWith('/') || pdfUrl.startsWith('http') ? pdfUrl : `/${pdfUrl}`;

    const loadingTask = pdfjsLib.getDocument({ url: fullUrl });

    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load PDF via PDF.js:', err);
          setError('Could not load the certificate document. Please check file availability.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      loadingTask.destroy();
    };
  }, [pdfUrl]);

  // Cancel any running renders
  const cancelRenderTasks = () => {
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {
        // no-op
      }
    });
    renderTasksRef.current = [];
  };

  // Render document pages onto canvas elements
  const renderPages = useCallback(async () => {
    if (!pdfDoc || !pageStageRef.current || !viewerAreaRef.current) return;

    const token = ++renderTokenRef.current;
    cancelRenderTasks();

    const stage = pageStageRef.current;
    stage.innerHTML = '';

    const pageNumbers: number[] = [];
    if (transition === 'page') {
      pageNumbers.push(currentPage);
    } else {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        pageNumbers.push(i);
      }
    }

    try {
      const firstPage = await pdfDoc.getPage(pageNumbers[0] || 1);
      if (token !== renderTokenRef.current) return;

      const firstBaseViewport = firstPage.getViewport({
        scale: 1,
        rotation: normalizedRotation(firstPage.rotate + rotation),
      });

      let availableWidth = Math.max(180, viewerAreaRef.current.clientWidth - 28);
      const availableHeight = Math.max(180, viewerAreaRef.current.clientHeight - 20);
      let targetScale = zoom * PDFJS_CSS_UNITS * PAGE_SCALE_FACTOR;

      if (layout === 'double' || layout === 'cover') {
        availableWidth = Math.max(180, (availableWidth - 16) / 2);
      }

      if (fitMode === 'width') {
        targetScale = availableWidth / firstBaseViewport.width;
      } else if (fitMode === 'page') {
        targetScale = Math.min(
          availableWidth / firstBaseViewport.width,
          availableHeight / firstBaseViewport.height
        );
      }

      const dpr = Math.max(1, window.devicePixelRatio || 1);

      for (let i = 0; i < pageNumbers.length; i++) {
        if (token !== renderTokenRef.current) return;

        const pageNum = pageNumbers[i];
        const page = pageNum === (pageNumbers[0] || 1) ? firstPage : await pdfDoc.getPage(pageNum);
        if (token !== renderTokenRef.current) return;

        const pageRotation = normalizedRotation(page.rotate + rotation);
        const viewport = page.getViewport({
          scale: targetScale * dpr,
          rotation: pageRotation,
        });

        const shell = document.createElement('section');
        shell.className = 'pdf-page-shell flex flex-col items-center mx-auto my-2 max-w-full';
        shell.id = `pdf-page-${pageNum}`;
        shell.dataset.page = String(pageNum);
        shell.setAttribute('aria-label', `Page ${pageNum}`);

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page bg-white border border-[#e1e3e6] shadow-[0_0_4px_rgba(0,0,0,0.14)] block shrink-0';
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) continue;

        shell.appendChild(canvas);

        if (layout !== 'single') {
          const pageNo = document.createElement('div');
          pageNo.className = 'text-[11px] text-[#626b73] mt-1';
          pageNo.textContent = String(pageNum);
          shell.appendChild(pageNo);
        }

        stage.appendChild(shell);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        });
        renderTasksRef.current.push(renderTask);

        try {
          await renderTask.promise;
        } catch (err: unknown) {
          if (err && (err as { name?: string }).name === 'RenderingCancelledException') return;
          console.warn('Render error:', err);
        }
      }
    } catch (err: unknown) {
      if (err && (err as { name?: string }).name === 'RenderingCancelledException') return;
      console.error('Error rendering pages:', err);
    }
  }, [pdfDoc, currentPage, transition, layout, rotation, zoom, fitMode, normalizedRotation]);

  useEffect(() => {
    renderPages();
  }, [renderPages]);

  // Thumbnails render
  const renderThumbnails = useCallback(async () => {
    if (!pdfDoc) return;
    const thumbContainer = document.getElementById('thumbnailListContainer');
    if (!thumbContainer) return;

    thumbContainer.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewportAtOne = page.getViewport({
        scale: 1,
        rotation: normalizedRotation(page.rotate + rotation),
      });

      const tScale = Math.min(
        (78 * thumbScale) / viewportAtOne.width,
        (112 * thumbScale) / viewportAtOne.height
      );

      const viewport = page.getViewport({
        scale: tScale,
        rotation: normalizedRotation(page.rotate + rotation),
      });

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `thumb-item flex flex-col items-center gap-1.5 w-full p-2 border rounded cursor-pointer transition-colors ${
        pageNum === currentPage
          ? 'border-[#b7c9df] bg-[#e7eef7]'
          : 'border-transparent hover:bg-[#eef1f4]'
      }`;
      button.setAttribute('aria-label', `Go to page ${pageNum}`);
      button.onclick = () => {
        setCurrentPage(pageNum);
        if (transition === 'continuous') {
          const target = document.getElementById(`pdf-page-${pageNum}`);
          if (target) {
            target.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        }
      };

      const canvas = document.createElement('canvas');
      canvas.className = 'thumb-canvas bg-white border border-[#cfd4d9] shadow-xs block';
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        page.render({
          canvasContext: ctx,
          viewport: viewport,
        });
      }

      const label = document.createElement('span');
      label.className = 'text-xs text-[#5b6268] font-medium';
      label.textContent = String(pageNum);

      button.appendChild(canvas);
      button.appendChild(label);
      thumbContainer.appendChild(button);
    }
  }, [pdfDoc, thumbScale, rotation, currentPage, transition, normalizedRotation]);

  useEffect(() => {
    if (sidebarOpen) {
      renderThumbnails();
    }
  }, [sidebarOpen, renderThumbnails]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    } else {
      containerRef.current.requestFullscreen().catch(console.warn);
    }
    setSettingsMenuOpen(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPageMenuOpen(false);
        setZoomMenuOpen(false);
        setSettingsMenuOpen(false);
      }
      if (transition === 'page' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          if (pdfDoc && currentPage < pdfDoc.numPages) {
            setCurrentPage((p) => p + 1);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          if (currentPage > 1) {
            setCurrentPage((p) => p - 1);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transition, pdfDoc, currentPage]);

  // Pan tool mouse events
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panMode || e.button !== 0 || !viewerAreaRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewerAreaRef.current.scrollLeft,
      scrollTop: viewerAreaRef.current.scrollTop,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // no-op
    }
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !viewerAreaRef.current) return;
    viewerAreaRef.current.scrollLeft =
      dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
    viewerAreaRef.current.scrollTop =
      dragStartRef.current.scrollTop - (e.clientY - dragStartRef.current.y);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[832px] max-lg:h-[540px] bg-[#f1f3f5] border-2 border-[#9d9d9d] rounded-xs overflow-hidden flex flex-col select-none ${
        isFullscreen ? '!h-screen !w-screen fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Viewer Toolbar */}
      <div
        role="toolbar"
        aria-label="Document viewer toolbar"
        className="relative z-30 h-[44px] bg-[#fbfbfb] border-b border-[#d9d9d9] px-2 flex items-center gap-1 text-[#87919a] shrink-0"
      >
        {/* Toggle Sidebar */}
        <button
          type="button"
          title="Sidebar"
          aria-label="Toggle sidebar"
          aria-pressed={sidebarOpen}
          onClick={() => setSidebarOpen((v) => !v)}
          className={`viewer-toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded-[3px] border border-transparent hover:bg-[#e7edf5] hover:border-[#dce4ee] transition-colors ${
            sidebarOpen ? 'bg-[#e7edf5] border-[#dce4ee] text-[#4d5761]' : 'text-[#87919a]'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="1.3" />
            <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
          </svg>
        </button>

        <span className="w-px h-5 mx-1 bg-[#d4d8dc]" aria-hidden="true" />

        {/* Page Options */}
        <div className="relative">
          <button
            type="button"
            title="Page settings"
            aria-label="Page settings"
            aria-expanded={pageMenuOpen}
            onClick={() => {
              setPageMenuOpen((v) => !v);
              setZoomMenuOpen(false);
              setSettingsMenuOpen(false);
            }}
            className={`viewer-toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded-[3px] border border-transparent hover:bg-[#e7edf5] hover:border-[#dce4ee] transition-colors ${
              pageMenuOpen ? 'bg-[#e7edf5] border-[#dce4ee] text-[#4d5761]' : 'text-[#87919a]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2.8h8l4 4V12" />
              <path d="M14 2.8v4h4" />
              <path d="M6 2.8v18.4h7" />
              <circle cx="17" cy="17" r="3.1" />
              <path d="M17 12.9v1M17 20v1M12.9 17H14M20 17h1" />
              <path d="m14.8 14.8-.7-.7m5.8 5.8-.7-.7m.7-4.4-.7.7m-4.4 4.4-.7.7" />
            </svg>
          </button>

          {/* Page Options Menu */}
          {pageMenuOpen && (
            <div className="viewer-popup absolute left-0 top-[40px] z-50 w-[240px] bg-white border border-[#cfd4d8] rounded shadow-xl p-2 text-[#3f4850] text-sm">
              <div className="px-2 py-1 text-xs font-semibold text-[#737c84] uppercase tracking-wider">
                Page Transition
              </div>
              <button
                type="button"
                onClick={() => {
                  setTransition('continuous');
                  setPageMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  transition === 'continuous' ? 'bg-[#e3eaf4] text-[#1e293b]' : 'hover:bg-[#eef1f4]'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2"><path d="M5 3h14M5 21h14M8 7v10m8-10v10"/><path d="m5 10 3-3 3 3m2 4 3 3 3-3"/></svg>
                </span>
                <span>Continuous Page</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransition('page');
                  setPageMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  transition === 'page' ? 'bg-[#e3eaf4] text-[#1e293b]' : 'hover:bg-[#eef1f4]'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/></svg>
                </span>
                <span>Page by Page</span>
              </button>

              <div className="h-px bg-[#e0e3e6] my-1.5" />

              <div className="px-2 py-1 text-xs font-semibold text-[#737c84] uppercase tracking-wider">
                Page Orientation
              </div>
              <button
                type="button"
                onClick={() => {
                  setRotation((r) => r + 90);
                  setPageMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[#eef1f4] transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2"><path d="M8 5H4v4M4 5l5 5"/><path d="M8 8a7 7 0 1 1-2 7"/><path d="M11 8h5v8h-5z"/></svg>
                </span>
                <span>Rotate Clockwise</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRotation((r) => r - 90);
                  setPageMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[#eef1f4] transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2"><path d="M16 5h4v4m0-4-5 5"/><path d="M16 8a7 7 0 1 0 2 7"/><path d="M8 8h5v8H8z"/></svg>
                </span>
                <span>Rotate Counterclockwise</span>
              </button>

              <div className="h-px bg-[#e0e3e6] my-1.5" />

              <div className="px-2 py-1 text-xs font-semibold text-[#737c84] uppercase tracking-wider">
                Page Layout
              </div>
              <button
                type="button"
                onClick={() => {
                  setLayout('single');
                  setPageMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  layout === 'single' ? 'bg-[#e3eaf4] text-[#1e293b]' : 'hover:bg-[#eef1f4]'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2"><path d="M6 3h12v18H6z"/></svg>
                </span>
                <span>Single Page</span>
              </button>
              <button
                type="button"
                disabled={numPages < 2}
                onClick={() => {
                  if (numPages >= 2) {
                    setLayout('double');
                    setPageMenuOpen(false);
                  }
                }}
                title={numPages < 2 ? 'Unavailable for a one-page document' : 'Double Page'}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  numPages < 2 ? 'opacity-40 cursor-not-allowed' : layout === 'double' ? 'bg-[#e3eaf4]' : 'hover:bg-[#eef1f4]'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2"><path d="M3 4h8v16H3zM13 4h8v16h-8z"/></svg>
                </span>
                <span>Double Page</span>
              </button>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-[#f0f2f4] rounded px-1 h-8">
          <div className="relative">
            <button
              type="button"
              title="Zoom percentage"
              aria-expanded={zoomMenuOpen}
              onClick={() => {
                setZoomMenuOpen((v) => !v);
                setPageMenuOpen(false);
                setSettingsMenuOpen(false);
              }}
              className="viewer-toolbar-btn inline-flex items-center justify-center gap-1 min-w-[58px] h-[30px] px-1 text-sm font-semibold italic text-[#3d4750] hover:bg-[#e4eaf3] rounded transition-colors"
            >
              <span>{Math.round(zoom * 100)}%</span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {zoomMenuOpen && (
              <div className="viewer-popup absolute left-0 top-[36px] z-50 w-[150px] bg-white border border-[#cfd4d8] rounded shadow-xl p-1 text-[#3f4850] text-sm">
                {[0.5, 0.69, 0.75, 0.77, 1, 1.25, 1.5, 2].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setZoom(z);
                      setFitMode('fixed');
                      setZoomMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded hover:bg-[#eef1f4] ${
                      zoom === z && fitMode === 'fixed' ? 'bg-[#e3eaf4] font-medium' : ''
                    }`}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
                <div className="h-px bg-[#e0e3e6] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setFitMode('width');
                    setZoomMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-[#eef1f4] ${
                    fitMode === 'width' ? 'bg-[#e3eaf4] font-medium' : ''
                  }`}
                >
                  Fit Width
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFitMode('page');
                    setZoomMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-[#eef1f4] ${
                    fitMode === 'page' ? 'bg-[#e3eaf4] font-medium' : ''
                  }`}
                >
                  Fit Page
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => {
              setZoom((z) => Math.max(0.25, z / 1.1));
              setFitMode('fixed');
            }}
            className="inline-flex items-center justify-center w-7 h-7 text-[#87919a] hover:text-[#4d5761] hover:bg-[#e4eaf3] rounded"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2">
              <circle cx="12" cy="12" r="8.5" /><path d="M8 12h8" />
            </svg>
          </button>

          <button
            type="button"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => {
              setZoom((z) => Math.min(4, z * 1.1));
              setFitMode('fixed');
            }}
            className="inline-flex items-center justify-center w-7 h-7 text-[#87919a] hover:text-[#4d5761] hover:bg-[#e4eaf3] rounded"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2">
              <circle cx="12" cy="12" r="8.5" /><path d="M8 12h8M12 8v8" />
            </svg>
          </button>
        </div>

        <span className="w-px h-5 mx-1 bg-[#d4d8dc]" aria-hidden="true" />

        {/* Pan Mode */}
        <button
          type="button"
          title="Pan"
          aria-label="Pan tool"
          aria-pressed={panMode}
          onClick={() => setPanMode((p) => !p)}
          className={`viewer-toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded-[3px] border border-transparent hover:bg-[#e7edf5] hover:border-[#dce4ee] transition-colors ${
            panMode ? 'bg-[#e7edf5] border-[#dce4ee] text-[#4d5761]' : 'text-[#87919a]'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10" />
            <path d="M10 10V3.5a1.5 1.5 0 0 1 3 0V10" />
            <path d="M13 10V5a1.5 1.5 0 0 1 3 0v6" />
            <path d="M16 11V8a1.5 1.5 0 0 1 3 0v6.5a7 7 0 0 1-7 7h-2.2a5 5 0 0 1-3.4-1.3L2.6 16.7a1.5 1.5 0 0 1 2.1-2.1L7 16.4" />
          </svg>
        </button>

        <div className="grow" />

        {/* Settings */}
        <div className="relative">
          <button
            type="button"
            title="Settings"
            aria-label="Settings"
            aria-expanded={settingsMenuOpen}
            onClick={() => {
              setSettingsMenuOpen((v) => !v);
              setPageMenuOpen(false);
              setZoomMenuOpen(false);
            }}
            className={`viewer-toolbar-btn inline-flex items-center justify-center w-8 h-8 rounded-[3px] border border-transparent hover:bg-[#e7edf5] hover:border-[#dce4ee] transition-colors ${
              settingsMenuOpen ? 'bg-[#e7edf5] border-[#dce4ee] text-[#4d5761]' : 'text-[#87919a]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.4 13.1a7.7 7.7 0 0 0 0-2.2l1.6-1.2-1.8-3.1-1.9.8a7.4 7.4 0 0 0-1.9-1.1L15.1 4h-3.6l-.3 2.3a7.4 7.4 0 0 0-1.9 1.1l-1.9-.8-1.8 3.1 1.6 1.2a7.7 7.7 0 0 0 0 2.2l-1.6 1.2 1.8 3.1 1.9-.8a7.4 7.4 0 0 0 1.9 1.1l.3 2.3h3.6l.3-2.3a7.4 7.4 0 0 0 1.9-1.1l1.9.8 1.8-3.1z" />
              <circle cx="13.3" cy="12" r="2.6" />
            </svg>
          </button>

          {settingsMenuOpen && (
            <div className="viewer-popup absolute right-0 top-[40px] z-50 w-[170px] bg-white border border-[#cfd4d8] rounded shadow-xl p-1.5 text-[#3f4850] text-sm">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#eef1f4] text-left transition-colors"
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#71808c]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2">
                    <path d="M8 3H3v5M3 3l7 7M16 3h5v5m0-5-7 7M3 16v5h5m-5 0 7-7m8 7h3v-5m0 5-7-7" />
                  </svg>
                </span>
                <span>{isFullscreen ? 'Exit full screen' : 'Full screen'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[210px] max-md:w-[170px] bg-[#f8f9fa] border-r border-[#cbd0d5] shadow-[2px_0_5px_rgba(0,0,0,0.05)] p-3 overflow-y-auto z-20 shrink-0">
            <p className="text-xs font-semibold text-[#59636c] uppercase mb-2">Pages</p>
            <div className="mb-3 pb-2 border-b border-[#e0e3e6]">
              <button
                type="button"
                title="Reset thumbnail size"
                aria-label="Reset thumbnail size"
                onClick={() => setThumbScale(1)}
                className="w-full h-[30px] mb-2 rounded bg-[#eef1f4] hover:bg-[#e3e8ef] border border-[#dfe3e8] text-[#75818c] flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2">
                  <rect x="5" y="4" width="14" height="16" rx="1.2" />
                  <path d="M8 8h8M8 11h8M8 14h5" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Smaller thumbnails"
                  onClick={() => setThumbScale((s) => Math.max(0.6, s - 0.1))}
                  className="text-sm font-bold text-[#737e88] w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
                >
                  −
                </button>
                <input
                  type="range"
                  min="60"
                  max="140"
                  step="10"
                  value={Math.round(thumbScale * 100)}
                  onChange={(e) => setThumbScale(Number(e.target.value) / 100)}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#5d83b1]"
                />
                <button
                  type="button"
                  title="Larger thumbnails"
                  onClick={() => setThumbScale((s) => Math.min(1.4, s + 0.1))}
                  className="text-sm font-bold text-[#737e88] w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
                >
                  +
                </button>
              </div>
            </div>

            <div id="thumbnailListContainer" className="flex flex-col items-center gap-3" />
          </aside>
        )}

        {/* Viewer Canvas Area */}
        <main
          ref={viewerAreaRef}
          aria-label="PDF document area"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex-1 overflow-auto bg-[#f1f3f5] viewer-scrollbar p-3 relative ${
            panMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {loading && (
            <div className="my-8 mx-auto p-3 max-w-sm bg-white border border-[#d6dadd] text-[#5b6268] text-sm text-center shadow-xs">
              Loading document…
            </div>
          )}

          {error && (
            <div className="my-8 mx-auto p-4 max-w-lg bg-white border border-red-200 text-red-700 text-sm shadow-xs">
              <p className="font-semibold mb-1">Failed to render PDF</p>
              <p className="text-xs">{error}</p>
              <div className="mt-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                >
                  Open PDF Directly
                </a>
              </div>
            </div>
          )}

          <div
            ref={pageStageRef}
            id="pageStage"
            className="flex flex-col items-center justify-start min-h-0 text-center"
          />
        </main>
      </div>
    </div>
  );
};
