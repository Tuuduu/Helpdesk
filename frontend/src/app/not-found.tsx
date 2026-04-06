import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="glass p-10 text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-gray-600 mb-6">Хуудас олдсонгүй</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
