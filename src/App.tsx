import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { DocumentViewer } from './components/DocumentViewer';
import { Footer } from './components/Footer';
import { ScrollTop } from './components/ScrollTop';
import { STUDENTS } from './data/students';
import { StudentRecord } from './types';

export const App: React.FC = () => {
  const [currentRef, setCurrentRef] = useState<string>('');
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [hasRefParam, setHasRefParam] = useState<boolean>(true);

  // Read ref from URL params or default to sample if testing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');

    if (refParam) {
      const cleanRef = refParam.trim();
      setCurrentRef(cleanRef);
      setHasRefParam(true);
      lookupStudent(cleanRef);
    } else {
      // Check if reference exists or prompt
      setHasRefParam(false);
      setStudent(null);
    }
  }, []);

  const lookupStudent = (ref: string) => {
    let found: StudentRecord | null = null;
    for (const key of Object.keys(STUDENTS)) {
      if (key.trim() === ref.trim()) {
        found = STUDENTS[key];
        break;
      }
    }
    setStudent(found);
  };

  const handleSearchRef = (newRef: string) => {
    setCurrentRef(newRef);
    if (!newRef) {
      setHasRefParam(false);
      setStudent(null);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    setHasRefParam(true);
    lookupStudent(newRef);

    // Update query string in browser without reload
    const url = new URL(window.location.href);
    url.searchParams.set('ref', newRef);
    window.history.replaceState({}, '', url.toString());
  };

  // Determine alert type and content
  const renderAlert = () => {
    if (!hasRefParam || !currentRef) {
      return (
        <AlertBanner
          type="warning"
          message={
            <span>
              No reference number provided. Please use a valid record link like:{' '}
              <button
                type="button"
                onClick={() => handleSearchRef('93548623-01-MYX8')}
                className="font-mono underline font-medium hover:text-black cursor-pointer"
              >
                ?ref=93548623-01-MYX8
              </button>
            </span>
          }
        />
      );
    }

    if (!student) {
      return (
        <AlertBanner
          type="danger"
          message={
            <span>
              No local record found for reference: <strong className="font-mono">{currentRef}</strong>
            </span>
          }
        />
      );
    }

    if (student.status === 'valid') {
      return (
        <AlertBanner
          type="success"
          message={
            <span>
              Local record of a document issued by IOSH (Institution of Occupational Safety and
              Health) to {student.name.trim()} on {student.issueDate.trim()}.
            </span>
          }
        />
      );
    }

    return (
      <AlertBanner
        type="danger"
        message="This local record is not marked as valid. Confirm its status through the official issuing organization."
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Main Page Layout */}
      <div className="flex-1 w-full flex flex-col">
        <div className="w-[calc(100%-40px)] 2xl:w-[calc(100%-86px)] max-w-[2640px] max-md:w-full mx-auto px-0 max-md:px-0 flex-1 flex flex-col">
          {/* Main White Surface */}
          <div
            id="svpPortlet"
            className="my-[39px] max-md:my-0 bg-white rounded-[4px] max-md:rounded-none p-[42px_33px_37px] max-md:p-2.5 shadow-none min-h-[calc(100vh-320px)] max-md:min-h-0 flex flex-col"
          >
            {/* Branding Header */}
            <Header currentRef={currentRef} onSearchRef={handleSearchRef} />

            {/* Verification Status Alert */}
            {renderAlert()}

            {/* PDF Viewer Container */}
            {student && student.status === 'valid' && student.pdf && (
              <div className="w-full mt-2">
                <DocumentViewer pdfUrl={student.pdf} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Scroll to Top */}
      <ScrollTop />
    </div>
  );
};
