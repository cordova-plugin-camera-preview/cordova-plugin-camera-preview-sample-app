/* global cordova, CameraPreview */

var app = {
	/* informative variables manually updated */
	plugin_version: '0.12.3',
	getVersion: function () {
		if (typeof (cordova.getAppVersion) != 'undefined') {
			// cordova-plugin-app-version present
			var onSuccess = function (version) {
				$('#app_version').html('App version: ' + version);
			};
			cordova.getAppVersion.getVersionNumber(onSuccess);
			$('#plugin_version').html('Plugin version ' + app.plugin_version);
		} else {
			// cordova-plugin-app-version missing
			$('#versions').hide();
		}
	},
	init: function () {
		$('#status').html('<span class="success">Device is ready</span>');

		// Set camera preview size
		$('#txtCameraWidth').val(window.screen.width - 40);
		$('#txtCameraHeight').val(window.screen.width - 40); // same as width

		$('#btnStartCamera').on('click', app.startCamera);
		$('#btnStopCamera').on('click', app.stopCamera);
		$('#btnSwitchCamera').on('click', app.switchCamera);
		$('#btnShow').on('click', app.show);
		$('#btnHide').on('click', app.hide);
		$('#btnTakePicture').on('click', app.takePicture);
		$('#btnTakeSnapshot').on('click', app.takeSnapshot);
		$('#btnSetPreviewSize').on('click', set.previewSize);

		$('#btnGetSupportedPictureSizes').on('click', get.supportedPictureSizes);
		$('#btnGetSupportedFlashModes').on('click', get.supportedFlashModes);
		$('#btnGetSupportedFocusModes').on('click', get.supportedFocusModes);
		$('#btnGetSupportedColorEffects').on('click', get.supportedColorEffects);
		$('#btnGetMaxZoom').on('click', get.maxZoom);

		$('#flashModes').on('change', set.flashMode);
		$('#focusModes').on('change', set.focusMode);
		$('#colorEffects').on('change', set.colorEffect);
		$('#zoomSlider').on('change', set.zoom);

		// Bind sample app own methods
		$('#btnGitHub').on('click', function () {
			window.open('https://github.com/cordova-plugin-camera-preview/cordova-plugin-camera-preview', '_system');
		});
		$('#btnWebsite').on('click', function () {
			window.open('https://www.andreszsogon.com/cordova-camera-preview-plugin-demo', '_system');
		});
		$('#btnPluginDemos').on('click', function () {
			window.open('https://github.com/andreszs/cordova-plugin-demos', '_system');
		});
	},
	startCamera: function () {
		var x = $('#txtCameraX').val();
		var y = $('#txtCameraY').val();
		var cwidth = $('#txtCameraWidth').val();
		var cheight = $('#txtCameraHeight').val();
		var optCameraDirection = $('#optCameraDirection option:selected').val();
		var optToBack = $('#optToBack option:selected').val();
		var toBack = (optToBack === 'true');
		var optPreviewDrag = $('#optPreviewDrag option:selected').val();
		var previewDrag = (optPreviewDrag === 'true');
		var tapPhoto = false; /* 'true' never worked for me */

		CameraPreview.startCamera({x: x, y: y, width: cwidth, height: cheight, camera: optCameraDirection, tapPhoto: tapPhoto, toBack: toBack, previewDrag: previewDrag});
		document.addEventListener("backbutton", stopCamera, false);
	},
	stopCamera: function () {
		CameraPreview.stopCamera();
		document.removeEventListener("backbutton", stopCamera, false);
	},
	takePicture: function () {
		var options = {
			width: 0,
			height: 0,
			quality: 85
		};
		if ($('#pictureSizes').children().length > 1) {
			var curValue = $('#pictureSizes option:selected').val();
			var resolution = curValue.split('x');
			// Example: 1600x900 resolution
			options.width = resolution[1]; // use 900
			options.height = resolution[0]; // use 1600
			$('#status').html('<span class="success">Taking ' + options.width + 'x' + options.height + ' photo</span>');
		} else {
			$('#status').html('<span class="success">Taking photo with default resolution</span>');
		}
		var successCallback = function (imgData) {
			var base64Image = 'data:image/jpeg;base64,' + imgData;
			// Show captured image
			$('#originalPicture').attr('src', base64Image);
			app.getPictureSize(base64Image, '#originalSize');

			// Vertically crop image to arbitrary height (done by demo app, not plugin)
			app.cropImage(base64Image, function (croppedBase64) {
				$('#croppedPicture').attr('src', croppedBase64);
			});
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.takePicture(options, successCallback, errorCallback);
	},
	takeSnapshot: function () {
		var options = {
			quality: 85
		};
		var successCallback = function (imgData) {
			var base64Image = 'data:image/jpeg;base64,' + imgData;
			// Show captured image
			$('#originalPicture').attr('src', base64Image);
			app.getPictureSize(base64Image, '#originalSize');
			$('#status').html('<span class="success">Taking snapshot with same size used on startCamera</span>');

			// Vertically crop image to arbitrary height (done by demo app, not plugin)
			app.cropImage(base64Image, function (croppedBase64) {
				$('#croppedPicture').attr('src', croppedBase64);
			});
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.takeSnapshot(options, successCallback, errorCallback);
	},
	show: function () {
		CameraPreview.show();
	},
	hide: function () {
		CameraPreview.hide();
	},
	switchCamera: function () {
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.switchCamera(successCallback, errorCallback);
	},
	setColorEffect: function () {
		var effect = $('#selectColorEffect').val();
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.setColorEffect(effect, successCallback, errorCallback);
	},
	/* VERTICALLY CROP IMAGE TO ARBITRARY HEIGHT.
	 * DONE BY DEMO APP, NOT PLUGIN. */
	cropImage: function (base64Image, callback) {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		var img = new Image();
		img.onload = function () {
			var offsetX = 0;
			var offsetY = 0;
			var sWidth = img.width;
			var sHeight = img.height;

			$('#swidth').html('img.width=' + img.width);
			$('#sheight').html('img.height=' + img.height);

			/* Calculate relative height to match credit-card size independently of current picture resolution. */
			var tWidth = sWidth;
			var tHeight = parseInt((sWidth * 310) / 480); /* 480x300 is an approximate credit-card size, but add 10px extra just in case. */
			offsetY = parseInt((sHeight / 2) - (tHeight / 2));
			$('#offsetY').html('offsetY=' + offsetY);

			canvas.setAttribute('width', tWidth);
			canvas.setAttribute('height', tHeight);
			$('#croppedSize').html(tWidth + 'x' + tHeight);

			/* Centered-vertical image crop */
			ctx.drawImage(img, offsetX, offsetY, tWidth, tHeight, 0, 0, sWidth, tHeight);

			callback(canvas.toDataURL());
		};
		img.src = base64Image;
	},
	getPictureSize: function (base64Image, objId) {
		var img = new Image();
		img.onload = function () {
			$(objId).html(img.width + 'x' + img.height);
		};
		img.src = base64Image;
	}
};

var get = {
	maxZoom: function () {
		var successCallback = function (pluginResult) {
			$('#zoomSlider').empty();
			for (var i = 1; i < parseInt(pluginResult); i++) {
				$('#zoomSlider').append('<option value="' + i + '">Zoom ' + i + '</option>');
			}
			$('#zoomSlider').prop('disabled', false);
			$('#status').html('<span class="success">Max zoom level retrieved is ' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.getMaxZoom(successCallback, errorCallback);
	},
	supportedPictureSizes: function () {
		var successCallback = function (pluginResult) {
			$('#pictureSizes').empty();
			pluginResult.forEach(function (dimension) {
				$('#pictureSizes').append('<option value="' + dimension.width + 'x' + dimension.height + '">' + dimension.width + 'x' + dimension.height + '</option>');
			});
			$('#pictureSizes').prop('disabled', false);
			$('#status').html('<span class="success">Retrieved ' + pluginResult.length + ' picture sizes</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.getSupportedPictureSizes(successCallback, errorCallback);
	},
	supportedFlashModes: function () {
		var successCallback = function (pluginResult) {
			$('#flashModes').empty();
			pluginResult.forEach(function (flashMode) {
				$('#flashModes').append('<option value="' + flashMode + '">' + flashMode + '</option>');
			});
			$('#flashModes').prop('disabled', false);
			$('#status').html('<span class="success">Retrieved ' + pluginResult.length + ' flash modes</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.getSupportedFlashModes(successCallback, errorCallback);
	},
	supportedFocusModes: function () {
		var successCallback = function (pluginResult) {
			$('#focusModes').empty();
			pluginResult.forEach(function (flashMode) {
				$('#focusModes').append('<option value="' + flashMode + '">' + flashMode + '</option>');
			});
			$('#focusModes').prop('disabled', false);
			$('#status').html('<span class="success">Retrieved ' + pluginResult.length + ' focus modes</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.getSupportedFocusModes(successCallback, errorCallback);
	},
	supportedColorEffects: function () {
		var successCallback = function (pluginResult) {
			$('#colorEffects').empty();
			pluginResult.forEach(function (flashMode) {
				$('#colorEffects').append('<option value="' + flashMode + '">' + flashMode + '</option>');
			});
			$('#colorEffects').prop('disabled', false);
			$('#status').html('<span class="success">Retrieved ' + $('#colorEffects').children().length + ' color effects</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.getSupportedColorEffects(successCallback, errorCallback);
	}
};

var set = {
	colorEffect: function () {
		var effect = $('#colorEffects').val();
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.setColorEffect(effect, successCallback, errorCallback);
	},
	flashMode: function () {
		var mode = $('#flashModes').val();
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.setFlashMode(mode, successCallback, errorCallback);
	},
	focusMode: function () {
		var mode = $('#focusModes').val();
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.setFocusMode(mode, successCallback, errorCallback);
	},
	zoom: function () {
		var zoom = $('#zoomSlider').val();
		$('#zoomValue').html('Zoom: ' + zoom);
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">Zoom: ' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		CameraPreview.setZoom(zoom, successCallback, errorCallback);
	},
	previewSize: function () {
		var cpsWidth = $('#cpsWidth').val();
		var cpsHeight = $('#cpsHeight').val();
		var successCallback = function (pluginResult) {
			$('#status').html('<span class="success">' + pluginResult + '</span>');
		};
		var errorCallback = function (pluginResult) {
			$('#status').html('<span class="error">' + pluginResult + '</span>');
		};
		console.log(cpsWidth);
		console.log(cpsHeight);
		CameraPreview.setPreviewSize({width: cpsWidth, height: cpsHeight}, successCallback, errorCallback);
	}
};

/* Cordova has been loaded. Perform any initialization that requires Cordova here. */
document.addEventListener('deviceready', function () {
	app.init();
	app.getVersion();
}, false);

/* backbutton is bound to this method after starting camera */
function stopCamera() {
	app.stopCamera();
}


