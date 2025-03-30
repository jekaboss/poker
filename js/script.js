let holeCards = [];
let communityCards = [];

const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const suits = ["S", "H", "D", "C"]; // S - Пік, H - Черви, D - Бубни, C - Трефи
const valueMap = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14 };
const suitMap = { "S": "Пік", "H": "Черви", "D": "Бубни", "C": "Трефи" };

function addCard(type) {
	const container = document.getElementById(type === "hole" ? "hole-cards" : "community-cards");
	const cardCount = type === "hole" ? holeCards.length : communityCards.length;
	const maxCards = type === "hole" ? 2 : 5;

	if (cardCount >= maxCards) {
		alert(`Ви вже додали максимальну кількість карт (${maxCards})!`);
		return;
	}

	const cardDiv = document.createElement("div");
	cardDiv.className = "card";

	const valueSelect = document.createElement("select");
	const suitSelect = document.createElement("select");

	values.forEach(val => {
		const option = document.createElement("option");
		option.value = val;
		option.text = val === "J" ? "Валет" : val === "Q" ? "Дама" : val === "K" ? "Король" : val === "A" ? "Туз" : val;
		valueSelect.appendChild(option);
	});

	suits.forEach(suit => {
		const option = document.createElement("option");
		option.value = suit;
		option.text = suitMap[suit];
		suitSelect.appendChild(option);
	});

	cardDiv.style.backgroundImage = `url('cards/${valueSelect.value}${suitSelect.value}.png')`;
	valueSelect.onchange = () => {
		cardDiv.style.backgroundImage = `url('cards/${valueSelect.value}${suitSelect.value}.png')`;
		if (holeCards.length === 2 && communityCards.length >= 3) {
			calculateWinChance();
		}
	};
	suitSelect.onchange = () => {
		cardDiv.style.backgroundImage = `url('cards/${valueSelect.value}${suitSelect.value}.png')`;
		if (holeCards.length === 2 && communityCards.length >= 3) {
			calculateWinChance();
		}
	};

	cardDiv.appendChild(valueSelect);
	cardDiv.appendChild(suitSelect);
	container.appendChild(cardDiv);

	if (type === "hole") {
		holeCards.push(cardDiv);
	} else {
		communityCards.push(cardDiv);
	}

	checkCalculateButton();
}

function checkCalculateButton() {
	const calcBtn = document.getElementById("calc-btn");
	const isEnabled = holeCards.length === 2 && communityCards.length >= 3;
	calcBtn.disabled = !isEnabled;
	if (isEnabled) {
		calculateWinChance();
	}
}

function calculateWinChance() {
	const hole = holeCards.map(card => ({
		value: valueMap[card.children[0].value],
		suit: card.children[1].value,
		element: card
	}));
	const community = communityCards.map(card => ({
		value: valueMap[card.children[0].value],
		suit: card.children[1].value,
		element: card
	}));

	const allCards = [...hole, ...community];
	const { strength, combination, usedCards } = evaluateHand(allCards);

	let winChance;
	if (communityCards.length === 3) {
		winChance = Math.min(100, strength * 8); // Флоп
	} else if (communityCards.length === 4) {
		winChance = Math.min(100, strength * 9); // Терн
	} else {
		winChance = Math.min(100, strength * 10); // Рівер
	}

	allCards.forEach(card => card.element.classList.remove("highlighted"));
	usedCards.forEach(card => card.element.classList.add("highlighted"));

	const stage = communityCards.length === 3 ? "Флоп" : communityCards.length === 4 ? "Терн" : "Рівер";
	document.getElementById("result").innerText = `${stage}: Ймовірність перемоги: ${winChance.toFixed(2)}% | Комбінація: ${combination}`;
}

function evaluateHand(cards) {
	const values = cards.map(card => card.value).sort((a, b) => b - a);
	const suits = cards.map(card => card.suit);
	const valueCounts = {};
	values.forEach(val => valueCounts[val] = (valueCounts[val] || 0) + 1);

	const isFlush = suits.every(suit => suit === suits[0]);
	const isStraight = values.every((val, i) => i === 0 || val === values[i - 1] - 1) ||
		(values[0] === 14 && values.slice(1).every((val, i) => val === 5 - i));
	const maxCount = Math.max(...Object.values(valueCounts));
	let usedCards = [];

	// Флеш-рояль (Royal Flush)
	if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
		usedCards = cards.slice(0, 5);
		return { strength: 10, combination: "Флеш-рояль", usedCards };
	}
	// Стріт-флеш (Straight Flush)
	if (isFlush && isStraight) {
		usedCards = cards.slice(0, 5);
		return { strength: 9, combination: "Стріт-флеш", usedCards };
	}
	// Каре (Four of a Kind)
	if (maxCount === 4) {
		const fourValue = Object.keys(valueCounts).find(val => valueCounts[val] === 4);
		usedCards = cards.filter(card => card.value === parseInt(fourValue));
		return { strength: 8, combination: "Каре", usedCards };
	}
	// Фулл-хауз (Full House)
	if (maxCount === 3 && Object.values(valueCounts).includes(2)) {
		const threeValue = Object.keys(valueCounts).find(val => valueCounts[val] === 3);
		const pairValue = Object.keys(valueCounts).find(val => valueCounts[val] === 2);
		usedCards = cards.filter(card => card.value === parseInt(threeValue) || card.value === parseInt(pairValue));
		return { strength: 7, combination: "Фулл-хауз", usedCards };
	}
	// Флеш (Flush)
	if (isFlush) {
		usedCards = cards.slice(0, 5);
		return { strength: 6, combination: "Флеш", usedCards };
	}
	// Стріт (Straight)
	if (isStraight) {
		usedCards = cards.slice(0, 5);
		return { strength: 5, combination: "Стріт", usedCards };
	}
	// Трійка (Three of a Kind)
	if (maxCount === 3) {
		const threeValue = Object.keys(valueCounts).find(val => valueCounts[val] === 3);
		usedCards = cards.filter(card => card.value === parseInt(threeValue));
		return { strength: 4, combination: "Трійка", usedCards };
	}
	// Дві пари (Two Pair)
	if (Object.values(valueCounts).filter(count => count === 2).length === 2) {
		const pairValues = Object.keys(valueCounts).filter(val => valueCounts[val] === 2);
		usedCards = cards.filter(card => card.value === parseInt(pairValues[0]) || card.value === parseInt(pairValues[1]));
		return { strength: 3, combination: "Дві пари", usedCards };
	}
	// Пара (One Pair)
	if (maxCount === 2) {
		const pairValue = Object.keys(valueCounts).find(val => valueCounts[val] === 2);
		usedCards = cards.filter(card => card.value === parseInt(pairValue));
		return { strength: 2, combination: "Пара", usedCards };
	}
	// Старша карта (High Card)
	usedCards = [cards[0]];
	return { strength: 1, combination: "Старша карта", usedCards };
}