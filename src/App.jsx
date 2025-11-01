import { useState, useEffect } from "react";
import { supabase } from "./supabase-client";

export default function App() {
  const [text, setText] = useState("");
  const [texts, setTexts] = useState([]);
  const [session, setSession] = useState(null);

  const fetchText = async () => {
    const { data, error } = await supabase
      .from("texts")
      .select("*")
      .order("created_at", { ascending: true });

    console.log(data);
    console.log(error);

    if (error) {
      console.error("Error fetching texts:", error.message);
      return;
    }

    setTexts(data || []);
  };

  useEffect(() => {
    if (session) {
      fetchText();
    }
  }, [session]);

  const fetchSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return;
    }
    setSession(data.session);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const { data, error } = await supabase
      .from("texts")
      .insert({
        text,
        email: session?.user?.email || "unknown",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting text:", error.message);
      return;
    }

    setText("");
    // update local state immediately
    setTexts((prev) => [...prev, data]);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="grid place-items-center h-svh">
      {!session ? (
        <button
          onClick={signInWithGoogle}
          className="bg-white flex items-center gap-3 border border-black px-6 py-4 rounded-md cursor-pointer"
        >
          <img
            src="https://docs.material-tailwind.com/icons/google.svg"
            alt="google"
            className="h-6 w-6"
          />
          Continue with Google
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            className="border border-black flex w-full"
          >
            <input
              placeholder="type something..."
              className="flex-1 py-4 px-2 outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="bg-black text-white px-4">Send</button>
          </form>

          <button
            onClick={signOut}
            className="absolute top-4 right-4 bg-red-500 px-4 py-2 text-white rounded-md"
          >
            Sign out
          </button>

          <h1 className="text-2xl font-bold">Previous Posts</h1>
          {texts.length > 0 &&
            texts.map((item) => (
              <div key={item.id}>
                <p>{item.text}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
