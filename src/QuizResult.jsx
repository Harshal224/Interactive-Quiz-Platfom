import React from 'react'

const QuizResult = (props) => {
  return (
    <>
    <div className='result'>
      Your Score: {props.score}<br/>
      Total Score: {props.totalScore}
    </div>
    <button id='next-btnq' onClick={props.tryAgain}>Try Again</button>
    </>
  )
}

export default QuizResult
