(function(global, document) {
  "use strict";

  if (!global.console) global.console = {};
  if (!document) document = new Document();

  const SVGNS = `http://www.w3.org/2000/svg`;
  const create = e => document.createElementNS(SVGNS, e);

  /**
   * Turn a style object into a CSS string.
   * @param {Object with css property-value pairs} style
   */
  function styleFlatten(style) {
    let styles = [];
    Object.keys(style).forEach(key => styles.push(`${key}: ${style[key]};`));
    return styles.join(` `);
  }

  /**
   * Get the minimum and maximum values from a Number[].
   * @param {Number array} data
   */
  function getMinMax(data) {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    data.forEach(v => {
      if (v < min) min = v;
      if (v > max) max = v;
    });
    return { min, max };
  }

  /**
   * I'm not sure we _need_ a class here, but let's
   * use one anyway for now...
   */
  class Plotter {
    constructor(x, y, z) {
      this.data = { x, y, z };
      let bbox = (this.bbox = {
        x: getMinMax(x),
        y: getMinMax(y)
      });
      bbox.width = bbox.x.max - bbox.x.min;
      bbox.height = bbox.y.max - bbox.y.min;
      if (z) {
        bbox.z = getMinMax(z);
        bbox.depth = bbox.z.max - bbox.z.min;
      }
    }

    /**
     * Create a scatterplot for our data.
     */
    scatterPlot(svg, options = {}) {
      svg.setAttribute(`xmlns`, SVGNS);
      if (!this.data.z) return this.scatterPlot2D(svg, options);
      return this.scatterPlot3D(svg, options);
    }

    /**
     * 2D scatter plot.
     * @param {SVG Element} svg
     * @param {property-value pairs object} options
     */
    scatterPlot2D(svg, options) {
      let bbox = this.bbox;
      let data = this.data;
      let pad = options.padding ? options.padding : 20;
      let textSize = 6;
      let textStyle = `font-size: ${textSize}pt;`;

      svg.setAttribute(
        `viewBox`,
        [
          bbox.x.min - pad,
          bbox.y.min - pad,
          bbox.width + pad * 2,
          bbox.height + pad * 2
        ].join(` `)
      );
      svg.setAttribute(`width`, `${bbox.width}px`);
      svg.setAttribute(`height`, `${bbox.height}px`);

      let xaxis = create(`path`);
      xaxis.setAttribute(
        `d`,
        [
          `M ${bbox.x.min - pad} ${options.xaxis || 0} L ${bbox.x.max + pad} ${options.xaxis || 0}`,
          `M ${bbox.x.min} ${options.xaxis || 0} L ${ bbox.x.min } ${(options.xaxis || 0) + textSize/2}`,
          `M ${bbox.x.max} ${options.xaxis || 0} L ${ bbox.x.max } ${(options.xaxis || 0) + textSize/2}`
        ].join(` `)
      );
      xaxis.setAttribute(`stroke`, `black`);
      xaxis.setAttribute(`stroke-width`, 0.25);
      svg.appendChild(xaxis);

      let xmin = create(`text`);
      xmin.textContent = bbox.x.min;
      xmin.setAttribute(`style`, textStyle);
      xmin.setAttribute(`text-anchor`, `middle`);
      xmin.setAttribute(`x`, bbox.x.min);
      xmin.setAttribute(`y`, (options.yaxis || 0) + 2 * textSize);
      svg.appendChild(xmin);

      let xmax = create(`text`);
      xmax.textContent = bbox.x.max;
      xmax.setAttribute(`style`, textStyle);
      xmin.setAttribute(`text-anchor`, `middle`);
      xmax.setAttribute(`x`, bbox.x.max);
      xmax.setAttribute(`y`, (options.yaxis || 0) + 2 * textSize);
      svg.appendChild(xmax);

      let yaxis = create(`path`);
      yaxis.setAttribute(
        `d`,
        [
          `M ${options.yaxis || 0} ${bbox.y.min - pad} L ${options.yaxis || 0} ${bbox.y.max + pad} `,
          `M ${options.yaxis || 0} ${bbox.y.min} L ${(options.yaxis || 0) - textSize/2 } ${bbox.y.min} `,
          `M ${options.yaxis || 0} ${bbox.y.max} L ${(options.yaxis || 0) - textSize/2 } ${bbox.y.max} `
        ].join(` `)
      );
      yaxis.setAttribute(`stroke`, `black`);
      yaxis.setAttribute(`stroke-width`, 0.25);
      svg.appendChild(yaxis);

      let ymin = create(`text`);
      ymin.textContent = bbox.y.min;
      ymin.setAttribute(`style`, textStyle);
      xmin.setAttribute(`text-anchor`, `right`);
      ymin.setAttribute(`dominant-baseline`, `central`);
      ymin.setAttribute(`x`, -2.5 * textSize);
      ymin.setAttribute(`y`, bbox.y.min);
      svg.appendChild(ymin);

      let ymax = create(`text`);
      ymax.textContent = bbox.y.max;
      ymax.setAttribute(`style`, textStyle);
      xmax.setAttribute(`text-anchor`, `right`);
      ymax.setAttribute(`dominant-baseline`, `central`);
      ymax.setAttribute(`x`, -2.5 * textSize);
      ymax.setAttribute(`y`, bbox.y.max);
      svg.appendChild(ymax);


      for (let i = 0, e = this.data.x.length; i < e; i++) {
        let pt = create(`circle`);
        pt.setAttribute(`cx`, data.x[i]);
        pt.setAttribute(`cy`, data.y[i]);
        pt.setAttribute(`r`, 0.5);
        pt.setAttribute(`fill`, `black`);
        svg.appendChild(pt);
      }

      return svg;
    }

    /**
     *
     * @param {plotting options} options
     */
    plot(options = {}) {
      let svg = create(`svg`);

      if (!options.type || options.type === `scatter`) {
        svg = this.scatterPlot(svg, options);
      }

      let utfurl = encodeURIComponent(svg.outerHTML);
      let bbox = this.bbox;
      let aspect = bbox.height / bbox.width;
      let h = (aspect * 100) | 0;
      let scale = 1 / 8;
      let style = {
        display: `inline-block`,
        color: `transparent`,
        background: `url(data:image/svg+xml;utf8,${utfurl})`,
        "background-repeat": `no-repeat`,
        "background-size": `${h}% 100%`,
        padding: `${h * scale}% ${100 * scale}%`,
        "max-width": `${bbox.width}px`,
        "max-height": `${bbox.height}px`
      };

      let css = styleFlatten(style);
      console.log(`%cconsole.plot`, css);
    }
  }

  global.console.plot = function(xData, yData, zDataOrOptions, options) {
    if (zDataOrOptions && !options) {
      new Plotter(xData, yData).plot(zDataOrOptions);
    } else {
      new Plotter(xData, yData, zDataOrOptions).plot(options);
    }
  };
})(this, this.document);
