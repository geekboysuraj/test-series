document.addEventListener('DOMContentLoaded', () => {
    const subjectSelection = document.getElementById('subject-selection');
    const testSeriesListSection = document.getElementById('test-series-list');
    const selectedSubjectNameDisplay = document.getElementById('selected-subject-name');
    const testSeriesListContainer = document.getElementById('test-series-list');
    const testSection = document.getElementById('test-section');
    const selectedTestNameDisplay = document.getElementById('selected-test-name');
    const questionContainer = document.getElementById('question-container');
    const submitTestBtn = document.getElementById('submit-test-btn');
    const resultSection = document.getElementById('result-section');
    const attemptedCountDisplay = document.getElementById('attempted-count');
    const correctCountDisplay = document.getElementById('correct-count');
    const wrongCountDisplay = document.getElementById('wrong-count');
    const accuracyDisplay = document.getElementById('accuracy');
    const totalScoreDisplay = document.getElementById('total-score');
    const backToSubjectsBtn = document.getElementById('back-to-subjects-btn');

    let currentSubject = null;
    let currentTestSeries = null;
    let questions = []
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let score = 0;

    const testSeriesFiles = {
        CN: ['Computer_Network_Test___01.json', 'Computer_Network_Test___02.json', 'Computer_Network_Test___03.json'],
        DBMS: ['DBMS_Test___01.json', 'DBMS_Test___02.json'],
        SPM: ['SPM_Test___01.json'],
        SAD: ['SAD_Test___01.json', 'SAD_Test___02.json', 'SAD_Test___03.json', 'SAD_Test___04.json']
    };

    const loadTestSeries = async (subject) => {
        console.log(`loadTestSeries called for subject: ${subject}`);
        currentSubject = subject;
        selectedSubjectNameDisplay.textContent = subject;
        testSeriesListContainer.innerHTML = '';

        const testSeriesNames = testSeriesFiles[subject] || []
        console.log(`Test series found for ${subject}:`, testSeriesNames);

        if (testSeriesNames.length > 0) {
            testSeriesNames.forEach(testSeriesName => {
                const testSeriesCard = document.createElement('div');
                testSeriesCard.classList.add('bg-white', 'shadow-md', 'rounded-lg', 'p-6', 'cursor-pointer', 'hover:shadow-lg', 'transition', 'duration-300');
                testSeriesCard.textContent = testSeriesName.replace('.json', '').replace(/_/g, ' ');
                testSeriesCard.dataset.testSeriesFile = testSeriesName;
                testSeriesCard.addEventListener('click', () => {
                    console.log(`Test series clicked: ${testSeriesName}`);
                    loadTest(subject, testSeriesName);
                });
                testSeriesListContainer.appendChild(testSeriesCard);
            });
            subjectSelection.classList.add('hidden');
            testSeriesListSection.classList.remove('hidden');
        } else {
            testSeriesListContainer.innerHTML = '<p>No test series found for this subject.</p>';
            subjectSelection.classList.add('hidden');
            testSeriesListSection.classList.remove('hidden');
        }
    };

    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subject = card.dataset.subject;
            console.log(`Subject clicked: ${subject}`);
            loadTestSeries(subject);
        });
    });

    const loadTest = async (subject, testSeriesFile) => {
        console.log(`loadTest called for subject: ${subject}, file: ${testSeriesFile}`);
        currentTestSeries = testSeriesFile;
        selectedTestNameDisplay.textContent = testSeriesFile.replace('.json', '').replace(/_/g, ' ');
        questionContainer.innerHTML = '';
        currentQuestionIndex = 0;
        userAnswers = {};
        score = 0;

        try {
            const filePath = `${subject}/${testSeriesFile}`;
            console.log(`Workspaceing JSON from: ${filePath}`);
            const response = await fetch(filePath);
            if (!response.ok) {
                const message = `HTTP error! status: ${response.status}`;
                console.error(message);
                throw new Error(message);
            }
            questions = await response.json();
            console.log('Questions loaded:', questions);
            if (questions && questions.length > 0) {
                console.log('First question:', questions[0]); // Log the first question data
                displayQuestion();
                testSeriesListSection.classList.add('hidden');
                testSection.classList.remove('hidden');
                submitTestBtn.classList.remove('hidden');
            } else {
                questionContainer.innerHTML = '<p>No questions found in this test series.</p>';
            }
        } catch (error) {
            console.error('Could not load test series:', error);
            questionContainer.innerHTML = `<p>Failed to load test series: ${error.message}</p>`;
        }
    };

    const displayQuestion = () => {
        if (currentQuestionIndex < questions.length) {
            const questionData = questions[currentQuestionIndex];
            console.log(`Displaying question at index ${currentQuestionIndex}:`, questionData);
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('mb-6', 'p-4', 'rounded-md', 'shadow-sm', 'bg-white');
            questionDiv.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-700 mb-3">Question ${currentQuestionIndex + 1}</h3>
                <div class="mb-4">${questionData.question}</div>
                <div id="options-container-${questionData.id}">
                    ${generateOptions(questionData)}
                </div>
            `;
            questionContainer.appendChild(questionDiv);

            const optionsContainer = document.getElementById(`options-container-${questionData.id}`);
            console.log('Options container:', optionsContainer);
            if (optionsContainer) {
                optionsContainer.addEventListener('click', (event) => {
                    const selectedOption = event.target.closest('.option-box');
                    if (selectedOption) {
                        console.log('Option clicked:', selectedOption.dataset.optionNumber, 'for question ID:', selectedOption.dataset.questionId);
                        handleOptionSelect(questionData, selectedOption.dataset.optionNumber);
                    }
                });
            } else {
                console.error('Options container not found!');
            }
        } else {
            submitTest();
        }
    };

    const generateOptions = (questionData) => {
        let optionsHTML = '';
        for (let i = 1; i <= 10; i++) {
            const optionKey = `option_${i}`;
            if (questionData[optionKey] !== undefined && questionData[optionKey].trim() !== '') {
                optionsHTML += `
                    <div class="option-box" data-question-id="${questionData.id}" data-option-number="${i}">
                        ${questionData[optionKey]}
                    </div>
                `;
            }
        }
        console.log('Generated options HTML:', optionsHTML);
        return optionsHTML;
    };

    const handleOptionSelect = (questionData, selectedOptionNumber) => {
        console.log('handleOptionSelect called with:', questionData.id, selectedOptionNumber);
        const questionId = questionData.id;
        const correctAnswer = questionData.answer;
        const optionsContainer = document.getElementById(`options-container-${questionId}`);
        if (!optionsContainer) {
            console.error('Options container not found in handleOptionSelect!');
            return;
        }
        const allOptionBoxes = optionsContainer.querySelectorAll('.option-box');

        if (!userAnswers[questionId]) {
            userAnswers[questionId] = selectedOptionNumber;

            allOptionBoxes.forEach(optionBox => {
                const optionNumber = optionBox.dataset.optionNumber;
                optionBox.classList.remove('selected');
                if (optionNumber === selectedOptionNumber) {
                    optionBox.classList.add('selected');
                    if (selectedOptionNumber === correctAnswer) {
                        optionBox.classList.add('correct-animation');
                    } else {
                        optionBox.classList.add('wrong-answer');
                    }
                }

                if (optionNumber === correctAnswer && selectedOptionNumber !== correctAnswer) {
                    optionBox.classList.add('correct-answer');
                }
            });

            setTimeout(() => {
                currentQuestionIndex++;
                if (currentQuestionIndex < questions.length) {
                    displayQuestion();
                } else {
                    submitTest();
                }
            }, 1000);
        }
    };

    const submitTest = () => {
        let attemptedCount = Object.keys(userAnswers).length;
        let correctCount = 0;
        let wrongCount = 0;

        questions.forEach(question => {
            const questionId = question.id;
            if (userAnswers[questionId]) {
                if (userAnswers[questionId] === question.answer) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        });

        const accuracy = questions.length > 0 ? ((correctCount / questions.length) * 100).toFixed(2) : 0;
        const totalScore = correctCount * parseFloat(questions[0]?.positive_marks || 1) - wrongCount * parseFloat(questions[0]?.negative_marks || 0);

        attemptedCountDisplay.textContent = attemptedCount;
        correctCountDisplay.textContent = correctCount;
        wrongCountDisplay.textContent = wrongCount;
        accuracyDisplay.textContent = accuracy;
        totalScoreDisplay.textContent = Math.max(0, totalScore).toFixed(2);

        testSection.classList.add('hidden');
        submitTestBtn.classList.add('hidden');
        resultSection.classList.remove('hidden');
    };

    backToSubjectsBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        testSeriesListSection.classList.add('hidden');
        subjectSelection.classList.remove('hidden');
        currentSubject = null;
        currentTestSeries = null;
        questions = []
        currentQuestionIndex = 0;
        userAnswers = {};
        score = 0;
        questionContainer.innerHTML = '';
    });
});