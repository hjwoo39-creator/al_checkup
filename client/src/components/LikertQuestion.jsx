export default function LikertQuestion({ question, value, onChange }) {
  return (
    <div className="question-card">
      <div className="question-text">
        <span className="question-number">{question.number}</span>
        {question.text}
      </div>
      <div className="likert-scale">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={`likert-btn ${value === score ? 'selected' : ''}`}
            onClick={() => onChange(score)}
            aria-label={`${score}점`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="likert-labels">
        <span>전혀 그렇지 않다</span>
        <span>보통이다</span>
        <span>매우 그렇다</span>
      </div>
    </div>
  );
}
