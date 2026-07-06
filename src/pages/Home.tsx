export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-4xl font-extrabold mb-4">home</h1>
      <p className="text-lg text-muted-foreground">
        welcome to the application. this is a placeholder <span className="accent-font">home</span> page.
      </p>
    </div>
  );
}
