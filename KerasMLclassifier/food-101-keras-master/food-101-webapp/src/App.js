import React, { Component } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import './App.css';
import getCalories from './dict.js';


const ndarray =require('ndarray');
const ops =require('ndarray-ops');

const { food101topK } = require('./utils');

const loadImage = window.loadImage;

let topFoodClassification = '';

const mapProb = (prob) => {
  if (prob * 100 < 2) {
    return '2%';
  } else {
    return (prob * 100 + '%');
  }
}

const Predictions = ({topK}) => {
  return (
    <table className='predictions'>
      <tbody>
      <tr>
        <th className='th'>Prediction</th>
        <th>Probability</th>
      </tr>
      { topK.map((pred, i) =>
        <tr key={i}>
          <td className='predLabel'>{pred.name}</td>
          <td className='predPercent'>
            <span className='predPercentLabel'>{(pred.probability*100).toFixed(5)}%</span>
            <div className='predBar' style={{width: mapProb(pred.probability)}}/>
          </td>
        </tr>
      )}
      </tbody>
    </table>
  );
}

class App extends Component {

  constructor() {
   super();
/*
    let hasWebgl = false;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    // Report the result.
    if (gl && gl instanceof WebGLRenderingContext) {
      hasWebgl = true;
    } else {
      hasWebgl = false;
    }
    console.log('WebGL enabled:', hasWebgl);
*/
    this.urlInput = null;
    this.state = {
      model: null,
      modelLoaded: false,
      modelLoading: false,
      modelRunning: false,
      imageLoadingError: false,
      loadingPercent: 0,
      classifyPercent: 0,
      topK: null,
      hasWebgl: true,
      url: 'https://support.rebrandly.com/hc/article_attachments/360020801793/rebrandly_url_shortener_010.png'
    };
  }


  loadModel = () => {
    console.log('Loading Model');
    const model = new window.KerasJS.Model({
      filepaths: {
        model: 'model.json' ,
        weights: 'https://s3.amazonaws.com/stratospark/food-101/model4b.10-0.68_weights.buf',
        metadata: 'model4b.10-0.68_metadata.json'
      },
      gpu: this.state.hasWebgl,
      layerCallPauses: true
    });

    let interval = setInterval(() => {
      const percent = model.getLoadingProgress();
      console.log('Progress', percent, model.xhrProgress);
      this.setState({
        loadingPercent: percent
      });
    }, 100);

    const waitTillReady = model.ready();

    waitTillReady.then(() => {
      clearInterval(interval);
      console.log('Model ready');
      this.setState({
        loadingPercent: 100,
        modelLoading: false,
        modelLoaded: true
      });

      setTimeout(() => this.loadImageToCanvas(this.state.url), 100);
    })
    .catch(err => {
      clearInterval(interval);
      console.log('err', err);
    });

    this.setState({
      modelLoading: true,
      model
    });
  }

  loadImageToCanvas = (url) => {
    console.log('Loading Image');
    if (!url) {
      return;
    };

    this.setState({
      imageLoadingError: false,
      imageLoading: true,
      loadingPercent: 0,
      classifyPercent: 0,
      topK: null
    });

    loadImage(
      'https://cors-anywhere.herokuapp.com/' + url,
      img => {
        if (img.type === 'error') {
          console.log('Error loading image');
          this.setState({
            imageLoadingError: true,
            imageLoading: false,
            modelRunning: false,
            url: null
          });

        } else {
          console.log('Image Loaded');
          const ctx = document.getElementById('input-canvas').getContext('2d');
          ctx.drawImage(img, 0, 0);
          this.setState({
            imageLoadingError: false,
            imageLoading: false,
            modelRunning: true
          });
          setTimeout(() => {
            this.runModel();
          }, 1000)
        }
      },
      {
        maxWidth: 299,
        maxHeight: 299,
        cover: true,
        crop: true,
        canvas: true,
        crossOrigin: 'Anonymous'
      }
    );
  }

  runModel = () => {
    console.log('Running Model');

    const ctx = document.getElementById('input-canvas').getContext('2d');
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    console.log(imageData);
    const { data, width, height } = imageData;
    console.log(data);
    // data processing
    // see https://github.com/fchollet/keras/blob/master/keras/applications/imagenet_utils.py
    // and https://github.com/fchollet/keras/blob/master/keras/applications/inception_v3.py
    let dataTensor = ndarray(new Float32Array(data), [ width, height, 4 ]);
    let dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
      width,
      height,
      3
    ]);
    ops.divseq(dataTensor, 255);
    ops.subseq(dataTensor, 0.5);
    ops.mulseq(dataTensor, 2);
    ops.assign(
      dataProcessedTensor.pick(null, null, 0),
      dataTensor.pick(null, null, 0)
    );
    ops.assign(
      dataProcessedTensor.pick(null, null, 1),
      dataTensor.pick(null, null, 1)
    );
    ops.assign(
      dataProcessedTensor.pick(null, null, 2),
      dataTensor.pick(null, null, 2)
    );

    const inputData = { input_1: dataProcessedTensor.data };
    const predPromise = this.state.model.predict(inputData);
    console.log(predPromise);
    const totalLayers = Object.keys(this.state.model.modelDAG).length
    let interval = setInterval(() => {
      const completedLayers = this.state.model.layersWithResults.length;
      this.setState({
        classifyPercent: ((completedLayers / totalLayers) * 100).toFixed(2)
      });
    }, 50);

    predPromise.then(outputData => {
      console.log(outputData);
      clearInterval(interval);
      const preds = outputData['dense_1'];
      console.log(preds);
      const topK = food101topK(preds);
      console.log(topK);

      topFoodClassification = Object.values(topK)[0].name;
      this.setState({
        topK,
        modelRunning: false
      });
    });
  }

  classifyNewImage = () => {
    const newUrl = this.urlInput.value;
    this.setState({
      url: this.urlInput.value
    });
    console.log('classifying new image', newUrl);
    this.loadImageToCanvas(newUrl);
  }

  render() {
    const {
      loadingPercent,
      modelLoaded,
      modelLoading,
      modelRunning,
      imageLoading,
      imageLoadingError,
      classifyPercent,
      topK
    } = this.state;
    return (
      <div className="App">

        <h1>CaloReal</h1>
        { !modelLoaded ?
        <p className='intro'>
          Load'er up!!!!!
        </p>
        : ''}
        <div className='init'>
        { !modelLoaded && !modelLoading ? <button onClick={this.loadModel}>Hit me :)</button> : ''}
        { !modelLoaded && modelLoading ?
          <div>
            <p className='loading'>Beep Boop; Loading: {loadingPercent}%</p>
            <ProgressBar animated striped variant="success" now={loadingPercent} />
          </div>
          : ''}
        { modelLoaded && imageLoading ?
          <p className='loading'>LOADING IMAGE</p>
          : ''}
        { modelLoaded && imageLoadingError ?
          <p className='error'>ERROR LOADING IMAGE.<br/>TRY DIFFERENT URL</p>
          : ''}
        { modelLoaded && modelRunning ?
          <div>
            <p className='loading'>CLASSIFYING: {classifyPercent}%</p>
            <ProgressBar animated striped variant="success" now={classifyPercent} />
          </div>
          : ''}
        </div>
        <div className='interactive'>
          { modelLoaded && !modelRunning && !imageLoading ?
          <p>
            Food Image URL: <input type='text' ref={(input) => { this.urlInput = input; }}/>
            <br/><br/>
            <button onClick={this.classifyNewImage}>Classify Image</button>
          </p>
          : '' }
          <canvas id='input-canvas' width='299' height='299'/>
          { topK ? <Predictions topK={topK}/> : ''}
        </div>
        <div>
          {modelLoaded && !modelRunning && !imageLoading ? getCalories(topFoodClassification.toString()) : ''}
        </div>

      </div>
    );
  }
}

export default App;
