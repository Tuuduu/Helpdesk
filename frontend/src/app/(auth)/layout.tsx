export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-700 to-primary-950 relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-primary-300/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl px-4 py-10">{children}</div>
    </div>
  );
}
