function checkWidth(range, k) {
	const width = Math.round(range / k);
	console.log("check width:", { rounded_width : width, range, k, rawWidth : range / k });
	if (width % 2 === 0) return checkInterval(range, k+1);
	return { width, rawWidth : range / k };
}

/**
 * @param {number[]} input 
 */
function calculateFrequencyDistribution(input) {
	// GET NUMBER OF DATA POINTS 
	const input_length = input.length;

	// GET HIGHEST/LOWEST VALUE
	let highest_value;
	let lowest_value;

	for (let i = 0; i < input_length; i++) {
		const item = input[i];
		if (!highest_value || highest_value < item) highest_value = item;
		if (!lowest_value || lowest_value > item) lowest_value = item;
	}
	
	// CALCULATE CLASS RANGE, MARK, WIDTH (and K using Sturge’s Rule)
	// references: https://themanufacturingacademy.com/sturges-rule-a-method-for-selecting-the-number-of-bins-in-a-histogram/ 
	// 			   https://www.statology.org/how-to-find-class-interval/
	const range = highest_value - lowest_value;
	const mark = range / 2;
	const k = Math.round(1 + 3.322 * (Math.log10(input_length))); // k = number of classes, https://www.shorttutorials.com/how-to-find-number-of-classes-in-statistics/index.html
	const { width, rawWidth } = checkWidth(range, k);

	// CALCULATE LOWER/UPPER LIMIT RANGE AND BOUNDARY
	const lower_limit_range = [];
	const upper_limit_range = [];
	
	let n = lowest_value;
	while (n < highest_value) {
		lower_limit_range.push(n);
		n += width;
		if (n > highest_value) {
			upper_limit_range.push(highest_value);
			break;
		}
		upper_limit_range.push(n - 1);
	}
	
	const lower_boundary = lower_limit_range.map((n) => n - 0.5);
	const upper_boundary = upper_limit_range.map((n) => n + 0.5);	

	// CALCULATE FREQUENCY 
	const midpoint = [];
	const frequency = [];

	for (let i = 0; i < input_length; i++){
		const item = input[i];
		
		for (let x = 0; x < lower_limit_range.length; x++){
			if (!frequency[x]) frequency[x] = 0;
			if (item >= lower_limit_range[x] && item <= upper_limit_range[x]) {
				frequency[x]++;
			}
		}
	}

	// CALCULATE CLASS MIDPOINT
	for (let i = 0; i < frequency.length; i++) {
		midpoint[i] = (lower_limit_range[i]+upper_limit_range[i])/2;
	}

	// CALCULATE CLASS INTERVAL
	const intervals = upper_limit_range.map((ulr, i) => ulr - lower_limit_range[i]);

	// CALCULATE LOWER/UPPER CUMULATIVE FREQUENCY
	const lower_cumulative_frequency = [];
	const upper_cumulative_frequency = [];
	const ucf_sum_const = frequency.reduce((s,v) => s+v, 0);

	for (let i = 0; i < frequency.length; i++) {
		let lcf = 0;
		let ucf = ucf_sum_const;
	
		for (let y = 0; y <= i; y++) {
			lcf += frequency[y] || 0;	
			ucf -= frequency[y-1] || 0;
		}

		lower_cumulative_frequency[i] = parseFloat(lcf.toFixed(2));
		upper_cumulative_frequency[i] = parseFloat(ucf.toFixed(2));
	}
	
	// CALCULATE RATIO FREQUENCY
	const ratio_frequency = [];
	const lower_ratio_cumulaive_frequency = [];
	const upper_ratio_cumulaive_frequency = [];
	
	for (let i = 0; i < frequency.length; i++) {
		ratio_frequency[i] = parseFloat((frequency[i] / ucf_sum_const).toFixed(2))
	}

	// CALCULATE LOWER/UPPER RATIO CUMULATIVE FREQUENCY
	for (let i = 0; i < ratio_frequency.length; i++) {

		let lrcf = 0
		let urcf = 1;

		for (let y = 0; y <= i; y++) {	
			lrcf += ratio_frequency[y];
			urcf -= ratio_frequency[y-1] || 0;
		}

		lower_ratio_cumulaive_frequency[i] = parseFloat(lrcf.toFixed(2));
		upper_ratio_cumulaive_frequency[i] = parseFloat(urcf.toFixed(2));
	}

	// OUTPUT
	console.log("FRQ", {
		mark,
		input,
		input_length,
		highest_value,
		lowest_value,
		range,
		intervals,
		width,
		lower_limit_range,
		upper_limit_range,
		lower_boundary,
		upper_boundary,
		frequency,
		midpoint,
		lower_cumulative_frequency,
		lower_ratio_cumulaive_frequency,
		upper_cumulative_frequency,
		upper_ratio_cumulaive_frequency,
		ratio_frequency
	})

	const html_dataset = document.getElementById("dataset");
	const html_dataset_length = document.getElementById("dataset_length");
	const html_range = document.getElementById("range");
	const html_k = document.getElementById("k");
	const html_class_width = document.getElementById("width");
	const html_table = document.getElementById("table_body");
	let html_rows = "";

	html_dataset.innerHTML = `Input Data: ${JSON.stringify(input)}`;
	html_dataset_length.innerHTML = `Input Data Length: ${input.length}`;
	html_range.innerHTML = `Range: ${range}`;
	html_k.innerHTML = `k: ${k} = Math.round(1 + 3.322 * Math.log(${input_length}))`;
	html_class_width.innerHTML = `Class Width: ${rawWidth} rounded off to ${width}`;
	
	for (let i = 0; i < frequency.length; i++) {
		html_rows += `
			<tr>
				<td>${lower_limit_range[i]}-${upper_limit_range[i]}</td>
				<td>${lower_boundary[i]}-${upper_boundary[i]}</td>
				<td>${intervals[i]}</td>
				<td>${midpoint[i]}</td>
				<td>${frequency[i]}</td>
				<td>${lower_cumulative_frequency[i]}</td>
				<td>${upper_cumulative_frequency[i]}</td>
				<td>${ratio_frequency[i]}</td>
				<td>${lower_ratio_cumulaive_frequency[i]}</td>
				<td>${upper_ratio_cumulaive_frequency[i]}</td>
			</tr>
		`;
	}

	html_table.innerHTML = html_rows;
}

function main() {
	
	const html_input = document.getElementById("input-data");
	const html_calculate_button = document.getElementById("calculate-button");

	const input = [
		57,53,65,55,50,45,64,52,16,46,42,63,33,64,54,25,54,35,48,
		55,70,47,39,58,52,36,65,75,26,20,55,60,83,61,45,63,49,42,
		35,18,51,45,42,65,39,59,45,41,30,40
	];

	html_input.value = input.join(",");

	html_calculate_button.addEventListener('click', (event) => {
		calculateFrequencyDistribution(html_input.value.split(",").map((x) => {
			const number = parseInt(x);
			return isNaN(number) ? null : number;
		}).filter((x) => x !== null))
	})

	html_calculate_button.click();
}

main();
