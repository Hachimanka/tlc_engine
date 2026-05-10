"use client";

import SubjectManagementTable from "./SubjectManagementTable";

// Legacy entry kept for old imports. Subject and Room Management now live as
// separate tenant-sidebar features, so this component must not render its own sidebar.
export default function SubjectRoomManagerPage() {
  return <SubjectManagementTable />;
}
