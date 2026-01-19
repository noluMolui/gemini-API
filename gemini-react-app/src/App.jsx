import { useReducer, useCallback, useEffect } from "react";
import SelectField from "./components/Select";
import listOfGenreOption from "./store/genre.json";
import listOfMoodOption from "./store/mood.json";

const initialState = {
  genre: "",
  mood: "",
  level: "",
  aiResponses: [],
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        aiResponses: [...state.aiResponses, action.payload],
      };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { genre, mood, level, aiResponses, loading, error } = state;

  const availableMoodBasedOnGenre = listOfMoodOption[genre];

  const fetchRecommendations = useCallback(async () => {
    if (!genre || !mood || !level) return;

    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Recommend 6 books for a ${level} ${genre} reader feeling ${mood}. Explain why.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No recommendation returned.";

      dispatch({ type: "FETCH_SUCCESS", payload: text });
    } catch (err) {
      dispatch({
        type: "FETCH_ERROR",
        payload: "Failed to fetch recommendations",
      });
    }
  }, [genre, mood, level]);

  useEffect(() => {
    if (aiResponses.length > 0) {
      console.log("New Gemini recommendation received");
    }
  }, [aiResponses]);

  return (
    <section>
      <SelectField
        placeholder="Please select a genre"
        id="genre"
        options={listOfGenreOption}
        onSelect={(value) =>
          dispatch({ type: "SET_FIELD", field: "genre", value })
        }
        value={genre}
      />

      <SelectField
        placeholder="Please select a mood"
        id="mood"
        options={availableMoodBasedOnGenre || []}
        onSelect={(value) =>
          dispatch({ type: "SET_FIELD", field: "mood", value })
        }
        value={mood}
      />

      <SelectField
        placeholder="Please select a level"
        id="level"
        options={["Beginner", "Intermediate", "Expert"]}
        onSelect={(value) =>
          dispatch({ type: "SET_FIELD", field: "level", value })
        }
        value={level}
      />

      <button onClick={fetchRecommendations} disabled={loading}>
        {loading ? "Loading..." : "Get Recommendation"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <br />
      <br />

      {aiResponses.map((recommend, index) => (
        <details key={index}>
          <summary>Recommendation {index + 1}</summary>
          <p>{recommend}</p>
        </details>
      ))}
    </section>
  );
}
