export function Header() {
  return (
    <div className="text-center mb-12">
      <div className="w-[60px] h-[60px] bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_40px_rgba(139,92,246,0.3)] relative">
        <span className="text-2xl text-white">⚡</span>
      </div>
      <h1 className="text-3xl font-light mb-2 bg-gradient-to-br from-dark-50 to-dark-200 bg-clip-text text-transparent">
        Stable Chat
      </h1>
      <p className="text-dark-300 text-sm tracking-widest uppercase">
        Universal AI Interface
      </p>
    </div>
  );
}
