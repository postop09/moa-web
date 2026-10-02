import { redirect } from 'next/navigation';

const AdminIndexRoute = () => {
  redirect('/admin/inquiries');
};

export default AdminIndexRoute;
