
//Replace below Date with the date you meet your love.
const date = new Date(2000, 4, 24).getTime();


const year = new Date().getFullYear();
// countdown Timer
let timer = setInterval(function() {

    // get today's date
    const today = new Date().getTime();

    // get the difference
    const diff = today - date;

    // math
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));
    let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // display
    document.getElementById("timer").innerHTML =
        "<div class=\"days\"> \
  <div class=\"numbers\">" + days + "</div>days</div> \
<div class=\"hours\"> \
  <div class=\"numbers\">" + hours + "</div>hours</div> \
<div class=\"minutes\"> \
  <div class=\"numbers\">" + minutes + "</div>minutes</div> \
<div class=\"seconds\"> \
  <div class=\"numbers\">" + seconds + "</div>seconds</div> \
</div>";

}, 1000);

//scrolling
$(function() {
    $('a[href*=\\#]').on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: $($(this).attr('href')).offset().top }, 500, 'linear');
    });
});

$(".animated").addClass("delay-1s");

var canvas = document.getElementById("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize the GL context
var gl = canvas.getContext('webgl');
if (!gl) {
    console.error("Unable to initialize WebGL.");
}

//Time step
var dt = 0.015;
//Time
var time = 0.0;


//Heart..........................

//************** Shader sources **************

var vertexSource = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

var fragmentSource = `
precision highp float;

uniform float width;
uniform float height;
vec2 resolution = vec2(width, height);

uniform float time;

#define POINT_COUNT 8

vec2 points[POINT_COUNT];
const float speed = -0.5;
const float len = 0.25;
float intensity = 0.9;
float radius = 0.015;

//https://www.shadertoy.com/view/MlKcDD
//Signed distance to a quadratic bezier
float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C){    
	vec2 a = B - A;
	vec2 b = A - 2.0*B + C;
	vec2 c = a * 2.0;
	vec2 d = A - pos;

	float kk = 1.0 / dot(b,b);
	float kx = kk * dot(a,b);
	float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
	float kz = kk * dot(d,a);      

	float res = 0.0;

	float p = ky - kx*kx;
	float p3 = p*p*p;
	float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
	float h = q*q + 4.0*p3;

	if(h >= 0.0){ 
		h = sqrt(h);
		vec2 x = (vec2(h, -h) - q) / 2.0;
		vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
		float t = uv.x + uv.y - kx;
		t = clamp( t, 0.0, 1.0 );

		// 1 root
		vec2 qos = d + (c + b*t)*t;
		res = length(qos);
	}else{
		float z = sqrt(-p);
		float v = acos( q/(p*z*2.0) ) / 3.0;
		float m = cos(v);
		float n = sin(v)*1.732050808;
		vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
		t = clamp( t, 0.0, 1.0 );

		// 3 roots
		vec2 qos = d + (c + b*t.x)*t.x;
		float dis = dot(qos,qos);
        
		res = dis;

		qos = d + (c + b*t.y)*t.y;
		dis = dot(qos,qos);
		res = min(res,dis);
		
		qos = d + (c + b*t.z)*t.z;
		dis = dot(qos,qos);
		res = min(res,dis);

		res = sqrt( res );
	}
    
	return res;
}


//http://mathworld.wolfram.com/HeartCurve.html
vec2 getHeartPosition(float t){
	return vec2(16.0 * sin(t) * sin(t) * sin(t),
							-(13.0 * cos(t) - 5.0 * cos(2.0*t)
							- 2.0 * cos(3.0*t) - cos(4.0*t)));
}

//https://www.shadertoy.com/view/3s3GDn
float getGlow(float dist, float radius, float intensity){
	return pow(radius/dist, intensity);
}

float getSegment(float t, vec2 pos, float offset, float scale){
	for(int i = 0; i < POINT_COUNT; i++){
		points[i] = getHeartPosition(offset + float(i)*len + fract(speed * t) * 6.28);
	}
    
	vec2 c = (points[0] + points[1]) / 2.0;
	vec2 c_prev;
	float dist = 10000.0;
    
	for(int i = 0; i < POINT_COUNT-1; i++){
		//https://tinyurl.com/y2htbwkm
		c_prev = c;
		c = (points[i] + points[i+1]) / 2.0;
		dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
	}
	return max(0.0, dist);
}

void main(){
	vec2 uv = gl_FragCoord.xy/resolution.xy;
	float widthHeightRatio = resolution.x/resolution.y;
	vec2 centre = vec2(0.5, 0.5);
	vec2 pos = centre - uv;
	pos.y /= widthHeightRatio;
	//Shift upwards to centre heart
	pos.y += 0.02;
	float scale = 0.000015 * height;
	
	float t = time;
    
	//Get first segment
	float dist = getSegment(t, pos, 0.0, scale);
	float glow = getGlow(dist, radius, intensity);
    
	vec3 col = vec3(0.0);
    
	//White core
	col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
	//Pink glow
	col += glow * vec3(0.94,0.14,0.4);
    
	//Get second segment
	dist = getSegment(t, pos, 3.4, scale);
	glow = getGlow(dist, radius, intensity);
    
	//White core
	col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
	//Blue glow
	col += glow * vec3(0.2,0.6,1.0);
        
	//Tone mapping
	col = 1.0 - exp(-col);

	//Output to screen
 	gl_FragColor = vec4(col,1.0);
}
`;

//************** Utility functions **************

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(widthHandle, window.innerWidth);
    gl.uniform1f(heightHandle, window.innerHeight);
}


//Compile shader and combine with source
function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
    }
    return shader;
}

//From https://codepen.io/jlfwong/pen/GqmroZ
//Utility to complain loudly if we fail to find the attribute/uniform
function getAttribLocation(program, name) {
    var attributeLocation = gl.getAttribLocation(program, name);
    if (attributeLocation === -1) {
        throw 'Cannot find attribute ' + name + '.';
    }
    return attributeLocation;
}

function getUniformLocation(program, name) {
    var attributeLocation = gl.getUniformLocation(program, name);
    if (attributeLocation === -1) {
        throw 'Cannot find uniform ' + name + '.';
    }
    return attributeLocation;
}

//************** Create shaders **************

//Create vertex and fragment shaders
var vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
var fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

//Create shader programs
var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

gl.useProgram(program);

//Set up rectangle covering entire canvas 
var vertexData = new Float32Array([-1.0, 1.0, // top left
    -1.0, -1.0, // bottom left
    1.0, 1.0, // top right
    1.0, -1.0, // bottom right
]);

//Create vertex buffer
var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

// Layout of our data in the vertex buffer
var positionHandle = getAttribLocation(program, 'position');

gl.enableVertexAttribArray(positionHandle);
gl.vertexAttribPointer(positionHandle,
    2, // position is a vec2 (2 values per component)
    gl.FLOAT, // each component is a float
    false, // don't normalize values
    2 * 4, // two 4 byte float components per vertex (32 bit float is 4 bytes)
    0 // how many bytes inside the buffer to start from
);

//Set uniform handle
var timeHandle = getUniformLocation(program, 'time');
var widthHandle = getUniformLocation(program, 'width');
var heightHandle = getUniformLocation(program, 'height');

gl.uniform1f(widthHandle, window.innerWidth);
gl.uniform1f(heightHandle, window.innerHeight);

function draw() {
    //Update time
    time += dt;

    //Send uniforms to program
    gl.uniform1f(timeHandle, time);
    //Draw a triangle strip connecting vertices 0-4
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(draw);
}

draw();

//Heart
$("#header-plugin").load("https://vivinantony.github.io/header-plugin/", function() {
    $("a.back-to-link").attr("href", "http://blog.thelittletechie.com/2015/03/love-heart-animation-using-css3.html#tlt")
});

var love = setInterval(function() {
    var r_num = Math.floor(Math.random() * 40) + 1;
    var r_size = Math.floor(Math.random() * 65) + 10;
    var r_left = Math.floor(Math.random() * 100) + 1;
    var r_bg = Math.floor(Math.random() * 25) + 100;
    var r_time = Math.floor(Math.random() * 5) + 5;

    $('.bg_heart').append("<div class='heart' style='width:" + r_size + "px;height:" + r_size + "px;left:" + r_left + "%;background:rgba(255," + (r_bg - 25) + "," + r_bg + ",1);-webkit-animation:love " + r_time + "s ease;-moz-animation:love " + r_time + "s ease;-ms-animation:love " + r_time + "s ease;animation:love " + r_time + "s ease'></div>");

    $('.bg_heart').append("<div class='heart' style='width:" + (r_size - 10) + "px;height:" + (r_size - 10) + "px;left:" + (r_left + r_num) + "%;background:rgba(255," + (r_bg - 25) + "," + (r_bg + 25) + ",1);-webkit-animation:love " + (r_time + 5) + "s ease;-moz-animation:love " + (r_time + 5) + "s ease;-ms-animation:love " + (r_time + 5) + "s ease;animation:love " + (r_time + 5) + "s ease'></div>");

    $('.heart').each(function() {
        var top = $(this).css("top").replace(/[^-\d\.]/g, '');
        var width = $(this).css("width").replace(/[^-\d\.]/g, '');
        if (top <= -100 || width >= 150) {
            $(this).detach();
        }
    });
}, 500);


var $header_top = $('.header-top');
var $nav = $('nav');

$header_top.find('a').on('click', function() {
    $(this).parent().toggleClass('open-menu');
});

$('#fullpage').fullpage({
    sectionsColor: ['#3dcfa1', '#348899', '#ff8b20', '#ff5757', '#ffd03c'],
    sectionSelector: '.vertical-scrolling',
    navigation: true,
    slidesNavigation: true,
    controlArrows: false,
    anchors: ['firstSection', 'secondSection', 'thirdSection', 'fourthSection', 'fifthSection', 'sixthSection', 'SeventhSection', 'eightSection', 'ninthSection', 'tenthsection', 'eleventhSection'],
    menu: '#menu',

    afterLoad: function(anchorLink, index) {
        $header_top.css('background', 'rgba(0, 47, 77, .3)');
        $nav.css('background', 'rgba(0, 47, 77, .25)');
        if (index == 10) {
            $('#fp-nav').hide();
        }
    },

    onLeave: function(index, nextIndex, direction) {
        if (index == 10) {
            $('#fp-nav').show();
        }
    },


});

// Section 09
$("#switch").click(function() {
    if ($("#fullpage").hasClass("night")) {
        $("#fullpage").removeClass("night");
        $("#switch").removeClass("switched");
    } else {
        $("#fullpage").addClass("night");
        $("#switch").addClass("switched");

    }
});

// Section 10
$(document).ready(function() {


    var box = $(".box"),
        orginal = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        temp = orginal,
        x = [],
        sec = 0,
        date1, date2,
        moves = 0,
        mm = 0,
        ss = 0,
        upIMG,
        images = ["/images/section10/image01.png"]
    img = 0;




    $('.me').css({ "background-image": 'url(' + images[0] + ')' });

    $(".start").click(function() {
        $(".start").delay(100).slideUp(500);
        $(".reset").show()
        $(".full").hide();
        $(".pre_img").addClass("prevent_click");

        date1 = new Date();
        Start();
        return 0;
    });

    function Start() {
        randomTile();
        changeBG(img);
        var count = 0,
            a,
            b,
            A,
            B;
        $(".me").click(function() {
            count++;
            if (count == 1) {
                a = $(this).attr("data-bid");
                $('.me_' + a).css({ "opacity": ".65" });
            } else {
                b = $(this).attr("data-bid");
                $('.me_' + a).css({ "opacity": "1" });
                if (a == b) {} else {
                    $(".me_" + a)
                        .addClass("me_" + b)
                        .removeClass("me_" + a);
                    $(this)
                        .addClass("me_" + a)
                        .removeClass("me_" + b);
                    $(".me_" + a).attr("data-bid", a);
                    $(".me_" + b).attr("data-bid", b);
                }
                moves++;
                swapping(a, b);
                checkCorrect(a);
                checkCorrect(b);
                a = b = count = A = B = 0;
            }
            if (arraysEqual(x)) {
                date2 = new Date();
                timeDifferece();
                showScore();
                return 0;
            }
        });
        return 0;
    }

    function randomTile() {
        var i;
        for (i = orginal.length - 1; i >= 0; i--) {
            var flag = getRandom(0, i);
            x[i] = temp[flag];
            temp[flag] = temp[i];
            temp[i] = x[i];
        }
        for (i = 0; i < orginal.length; i++) {
            box.append(
                '<div  class="me me_' + x[i] + ' tile" data-bid="' + x[i] + '"></div>'
            );
            if ((i + 1) % 6 == 0) box.append("<br>");
        }
        i = 17;
        return 0;
    }

    function arraysEqual(arr) {
        var i;
        for (i = orginal.length - 1; i >= 0; i--) {
            if (arr[i] != i) return false;
        }
        return true;
    }

    function checkCorrect(N1) {
        var pos = x.indexOf(parseInt(N1, 10));
        if (pos != N1) {
            return;
        }
        $(".me_" + N1).addClass("correct , prevent_click ");
        return;
    }

    function swapping(N1, N2) {
        var first = x.indexOf(parseInt(N1, 10)),
            second = x.indexOf(parseInt(N2, 10));
        x[first] = parseInt(N2, 10);
        x[second] = parseInt(N1, 10);
        return 0;
    }

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function timeDifferece() {
        var diff = date2 - date1;
        var msec = diff;
        var hh = Math.floor(msec / 1000 / 60 / 60);
        msec -= hh * 1000 * 60 * 60;
        mm = Math.floor(msec / 1000 / 60); // Gives Minute
        msec -= mm * 1000 * 60;
        ss = Math.floor(msec / 1000); // Gives Second
        msec -= ss * 1000;
        return 0;
    }


    function changeBG(img) {
        if (img != 3) {
            $('.me').css({
                "background-image": "url(" + images[img] + ")"
            });
            return
        } else
            $('.me').css({ "background-image": "url(" + upIMG + ")" });
    }

    $('.pre_img li').hover(function() {
        img = $(this).attr("data-bid");
        changeBG(img);

    });

    function showScore() {
        $('#min').html(mm);
        $('#sec').html(ss);
        $('#moves').html(moves);
        setTimeout(function() {
            $('.cover').slideDown(350);
        }, 1050);
        return 0;
    }

    $('.OK').click(function() {
        $('.cover').slideUp(350);
    });

    $('.reset').click(function() {
        $(".reset").hide()
        $(".tile").remove();
        $("br").remove();
        $(".full").show();
        $(".start").show();
        $(".pre_img").removeClass("prevent_click");

        temp = orginal;
        x = [];
        moves = ss = mm = 0;
        return 0;
    });

    $("#upfile1").click(function() {
        $("#file1").trigger('click');
    });

    $("#file1").change(function() {
        readURL(this);
    });

    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                upIMG = e.target.result;
                img = 3;
                changeBG(3);
            }
            reader.readAsDataURL(input.files[0]);
        }

    }
});

//section03
$(function() {
    var arrow = $('.chat-head img');
    var textarea = $('.chat-text textarea');

    arrow.on('click', function() {
        var src = arrow.attr('src');

        $('.chat-body').slideToggle('fast');
        if (src == 'https://maxcdn.icons8.com/windows10/PNG/16/Arrows/angle_down-16.png') {
            arrow.attr('src', 'https://maxcdn.icons8.com/windows10/PNG/16/Arrows/angle_up-16.png');
        } else {
            arrow.attr('src', 'https://maxcdn.icons8.com/windows10/PNG/16/Arrows/angle_down-16.png');
        }
    });

    textarea.keypress(function(event) {
        var $this = $(this);

        if (event.keyCode == 13) {
            var msg = $this.val();
            $this.val('');
            $('.msg-insert').prepend("<div class='msg-send'>" + msg + "</div>");
        }
    });

});

// section 07
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$.fn.randomOrder = function(animate) {
    this.each(function() {
        var image = $(this);

        // Viewport Dimensions
        var vpHeight = $(window).height();
        var vpWidth = $(window).width();

        // Image Position
        var xPos = getRandomInt(0, vpWidth - image.width());
        var yPos = getRandomInt(0, vpHeight - image.height());
        var zIndex = getRandomInt(0, 12);

        // Animation Duration
        if (animate) var dur = 500;
        else var dur = 0;

        image.animate({ left: xPos, top: yPos, 'z-index': zIndex }, dur);
    });
};



//Setup
$('.img07').randomOrder(false);
$('.img07').draggable({ stack: "img" });
