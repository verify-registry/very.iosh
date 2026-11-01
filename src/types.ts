export interface StudentRecord {
  name: string;
  arabicName?: string;
  certificateId: string;
  issueDate: string;
  issuer: string;
  pdf: string;
  status: 'valid' | 'invalid' | 'revoked' | string;
}

export type StudentsMap = Record<string, StudentRecord>;

export type PageTransitionMode = 'continuous' | 'page';
export type PageLayoutMode = 'single' | 'double' | 'cover';
export type FitMode = 'fixed' | 'width' | 'page';
