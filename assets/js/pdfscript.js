// script.js
const pdf = '../../gcp.pdf';


const initialState = {
	pdfDoc: null,
	currentPage: 1,
	pageCount: 0,
	zoom: 1,
};

// Load the document.
pdfjsLib
	.getDocument(pdf)
	.promise.then((data) => {
		initialState.pdfDoc = data;
		console.log('pdfDocument', initialState.pdfDoc);

		pageCount.textContent = initialState.pdfDoc.numPages;

		renderPage();
	})
	.catch((err) => {
		alert(err.message);
	});