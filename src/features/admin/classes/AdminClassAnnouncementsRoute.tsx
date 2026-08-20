import { useParams } from "react-router-dom";
import { AdminClassAnnouncements } from "./AdminClassAnnouncements";
export default function AdminClassAnnouncementsRoute(){return <AdminClassAnnouncements classId={Number(useParams().classId)}/>}
