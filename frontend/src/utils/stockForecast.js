import * as tf from '@tensorflow/tfjs';

/**
 * Προβλέπει το επόμενο επίπεδο αποθέματος με βάση το ιστορικό.
 * @param {Array<{date: string, quantity: number}>} history - Ιστορικό αποθεμάτων (ταξινομημένο κατά ημερομηνία).
 * @returns {Promise<number>} - Η προβλεπόμενη ποσότητα για το επόμενο βήμα.
 */
export async function predictStockDepletion(history) {
  if (!history || history.length < 2) return null;

  // Μετατροπή ημερομηνιών σε αριθμητικά βήματα
  const xs = tf.tensor1d(history.map((h, i) => i));
  const ys = tf.tensor1d(history.map(h => h.quantity));

  const model = tf.sequential();
  model.add(tf.layers.dense({units: 1, inputShape: [1]}));
  model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

  await model.fit(xs, ys, {epochs: 100});

  // Προβλέπει για το επόμενο βήμα (π.χ. επόμενη μέρα/εγγραφή)
  const nextIndex = history.length;
  const prediction = model.predict(tf.tensor2d([nextIndex], [1, 1]));
  return prediction.dataSync()[0];
}