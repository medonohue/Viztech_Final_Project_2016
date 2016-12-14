console.log('10.1');

var m = {t:50,r:50,b:50,l:50},
    w = document.getElementById('canvas').clientWidth - m.l - m.r,
    h = document.getElementById('canvas').clientHeight + m.t ;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width', w/2)
    .attr('height', h + m.t + m.b)
    .append('g').attr('class','plot')
    .attr('transform','translate('+ m.l+','+ m.t+')');

var plot2 = d3.select('.canvas')
    .append('svg')
    .attr('width', w/2)
    .attr('height', h * 2)
    .append('g').attr('class','plot')
    .attr('transform','translate('+ m.l+',0)')
    ;


var types = d3.set();
            console.log(types)

var bos_neighborhoods = d3.set();
//The 'selected' arrays gets data from selections
var selected = d3.set();
    console.log(selected)


var scaleColor = d3.scaleOrdinal()
    .range(['#77d2d8','#a3923f','#c6035f','#ff7b00']);
var scaleX = d3.scaleLinear()
    .range([0,w/3]);//why doesn't it need a domain???

//Mapping specific functions

//Projection
var projection = d3.geoAlbers() ;

//Geopath
var pathGenerator = d3.geoPath()
    .projection(projection);

// Load data
d3.queue()
    .defer(d3.json, '../data/bos_neighborhoods.json')
    .defer(d3.csv, '../data/boston_listings_cleaned_hoods.csv', parseData)
    .await(function(err, geo, data){
        // console.log(geo);
        // console.log(data);
    



        var maxPrice = d3.max(data, function(d){return d.price;}),
            minPrice = d3.min(data, function(d){return d.price;});
        console.log(maxPrice, minPrice);

        var scaleX2 = d3.scaleLinear()
        .domain([minPrice,maxPrice])
        .range([0,w/3]);

        var scaleY = d3.scaleOrdinal()
            .domain(bos_neighborhoods.values())
            .range(d3.range(40, h, h/bos_neighborhoods.values().length))//need Navi to explain this to me

        //Axis
        var axisX = d3.axisBottom()
        .scale(scaleX2)
        .tickFormat(function(d) { return '$'+ d })
        .tickSize(0);

        var axisY = d3.axisLeft()
        .scale(scaleY)
        // .tickFormat(function(d) { return '$'+ d })
        .tickSize(0);

    var priceByNeighborhood = d3.nest().key(function(d){return d.neighborhood})
        .entries(data);
    console.log(priceByNeighborhood)

    priceByNeighborhood.forEach(function(n){
       n.averagePrice = d3.mean(n.values, function(d){return d.price})
        n.averagePrice = d3.format('.4n')(n.averagePrice)

    });

    console.log(priceByNeighborhood)

        //Represent dots
        var hideY = plot2.append('g').attr('class','axis axis-y')
            .attr('transform','translate(40,0)')
            .call(axisY);

    scaleColor.domain( types.values() );
    scaleX2.domain( d3.extent(data,function(d){return d.price}) );//sets domain for x scale - why here instead of above?? finds lowest and highest dates

        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( types.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){

                var dataFiltered = data.filter(function(e){return(d) == e.roomType});
                
                draw(dataFiltered)

            });
        d3.select('.btn-group-n')
            .selectAll('.btn')
            // .append('a')
            // .html('By Neighborhood')
            // .attr('href','#')
            // .attr('class','btn btn-default')
            // .style('color','white')
            // .style('background','blue')
            // .style('border-color','white')
            .on('click',function(d){
                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)
                // var dataFiltered = data.filter(function(e){return(d) == e.roomType});
                
                draw(data, true)

            });

        //Draw axis
        plot2.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,0)')
            .call(axisX);


        d3.select("#goal").on("input", function() {
            goal = +this.value;
        d3.select('#goal-value').text(goal);

        plot.selectAll(".point").each(function(d) { 
            this.style.opacity = d.price < goal ? .65 : 0; 
        });
        plot2.selectAll(".point").each(function(d) { 
            this.style.opacity = d.price < goal ? .65 : 0; 
        });

    });



    //Update projection to fit all the data within the drawing extent
        projection
            .scale( 190000 )
            .rotate( [71.057,0] )
            .center( [0, 42.313] )
            .translate( [w/4,h/6] );

        var hoods =	plot.selectAll('path')
            .data( geo.features )
            .enter()
            .append( "path" )
            .attr( "fill", "#f9f9f9" )
            .attr( "stroke", "#ccc")
            .attr( "d", pathGenerator );

        draw(data);



        function draw(data, neighborhoodActive = false){
            console.log(data[0].neighborhood, scaleY(data[0].neighborhood))
            data.forEach(function(d){ //What did Siqi explain to me about this?
                d.r = 2
                d.x0 = scaleX2(d.price)
                d.y0 = (neighborhoodActive) ? scaleY(d.neighborhood): h/12
            })

hideY.selectAll("text")
    .style('fill',  function(d) {
        if(neighborhoodActive == true){
            return 'black';
        } else {
            return 'none';
        }
    })


    
    //Represent a feature collection of points
    var node = plot.selectAll('.point')
        .data(data,function(d){return d.id})
        ;

    var nodeEnter = node.enter()
        .append('circle').attr('class','point')
        .merge(node)
        .attr('transform',function(d){
           var xy = projection(d.location);
           return 'translate('+xy[0]+','+xy[1]+')';
        })
        .style('fill',function(d){return scaleColor(d.roomType)})
        .attr('r',2)


        .on('click',function(d){
            d3.select(this).attr('r',6).style('fill','black');
        })


        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.select('.roomType')
                .html(d.roomType).attr('class','roomType '+ d.roomType[0])
            tooltip.select('.title')
                .html(d.neighborhood)
            tooltip.select('.address')
                .html(d.address)
            tooltip.select('.value')
                .html('$' + d.price)
                ;

            tooltip.transition().style('opacity',1);

            d3.select(this).style('stroke-width','3px').attr('stroke','black');
        })
        .on('mousemove',function(d){
            var tooltip = d3.select('.custom-tooltip');
            var xy = d3.mouse( d3.select('.container').node() );
            tooltip
                .style('left',xy[0]+0+'px')
                .style('top',xy[1]-215+'px');
        })
        .on('mouseleave',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.transition().style('opacity',0);

            d3.select(this).style('stroke-width','0px');
        })
        ;



    //UPDATE + ENTER
    // nodeEnter
    //     .append('circle')
    //     .attr('transform',function(d){
    //        var xy = projection(d.location);
    //        return 'translate('+xy[0]+','+xy[1]+')';
    //     })
    //     .merge(node)
    //     .attr('r',2)
    //     .transition()
    //     .attr('transform',function(d){
    //        var xy = projection(d.location);
    //        return 'translate('+xy[0]+','+xy[1]+')';
    //     })
    //     .style('fill',function(d){return scaleColor(d.roomType)
    //     });
            var node2 = plot2.selectAll('.point')
                    .data(data,function(d){return d.id});


            var nodeEnter2 = node2.enter()
                    .append('g').attr('class','point')
                    .attr('transform',function(d){
                        return 'translate('+ scaleX2(d.price)+','+ 20+')'
                    })
                    .on('click',function(d){console.log(d)});
            nodeEnter2.append('circle').attr('class','inner')
                 .attr('r',function(d){return d.r})
                 .style('fill',function(d){return scaleColor(d.roomType)})   



        .on('click',function(d){
            d3.select(this).attr('r',6).style('fill','black');
        })


        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.select('.roomType')
                .html(d.roomType).attr('class','roomType '+ d.roomType[0])
            tooltip.select('.title')
                .html(d.neighborhood)
            tooltip.select('.address')
                .html(d.address)
            tooltip.select('.value')
                .html('$' + d.price)
                ;

            tooltip.transition().style('opacity',1);

            d3.select(this).style('stroke-width','3px').attr('stroke','black');
        })
        .on('mousemove',function(d){
            var tooltip = d3.select('.custom-tooltip');
            var xy = d3.mouse( d3.select('.container').node() );
            tooltip
                .style('left',xy[0]+0+'px')
                .style('top',xy[1]-215+'px');
        })
        .on('mouseleave',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.transition().style('opacity',0);

            d3.select(this).style('stroke-width','0px');
        })

    //EXIT
    node.exit().remove();
    node2.exit().remove();

        //Force positions

            var forceX = d3.forceX(data)
                    .x(function(d){return scaleX(d.x0)})
                    .strength(.5);
            var forceY = d3.forceY(data)
                    .y(function(d){return d.y0})
                    .strength(1);


        //Force simulation

            var simulation = d3.forceSimulation(data)
                    .force('positionX', forceX)
                    .force('positionY', forceY)
                    .force('collide', d3.forceCollide(function(d,i){return d.r+2}))
                    //.force('charge', d3.forceManyBody().strength(-25))
                    //.alphaTarget(0)
                    .on('tick',onTick);


            function onTick(){
                nodeEnter2.select('circle')
                    .attr('cx',function(d){return d.fx})
                    .attr('cy',function(d){return d.y});
                }

            //Add the SVG Text Element to the svgContainer
            var text = node2.select("text")
                    .data(priceByNeighborhood)
                    .enter()
                    .append("text")

            //Add SVG Text Element Attributes
            var textLabels = text
                    .attr("x",function(d) { return scaleX2(d.averagePrice) + 4; })
                    .attr("y",function(d) { return scaleY(d.key); })
                    .text(function(d){ return '$' + d.averagePrice; })
                    .attr("font-family", "sans-serif")
                    .attr("font-weight", "bold")
                    .attr("font-size", "10px")
                    .style('fill',  function(d) {
                        if(neighborhoodActive == true){
                            return 'black';
                        } else {
                            return 'none';
                        }
                    })
            var avgLine = node2.select('line')
                    .data(priceByNeighborhood)
                    .enter()
                    .append("line")          // attach a line
                    .style("stroke", "black")  // colour the line
                    .attr("x1", function(d) { return scaleX2(d.averagePrice); })     // x position of the first end of the line
                    .attr("y1", function(d) { return scaleY(d.key) + 24; })      // y position of the first end of the line
                    .attr("x2", function(d) { return scaleX2(d.averagePrice); })     // x position of the second end of the line
                    .attr("y2", function(d) { return scaleY(d.key) - 10; })
                    .attr("stroke-width", function(d) {
                        if(neighborhoodActive == true){
                            return '1';
                        } else {
                            return '0';
                        }
                    });


};//end function draw data
    });

function parseData(d){

    if( !types.has(d.room_type) ){
        types.add(d.room_type);
    }


    if( !bos_neighborhoods.has(d.neighborho) ){
        bos_neighborhoods.add(d.neighborho);
    }

    return {
        id: +d.room_id,
        x: +d.X,
        y: +d.Y,
        location:[+d.X , +d.Y],
        roomType: d.room_type,
        price:+d.price,
        neighborhood: d.neighborho,
        address: d.address,
        stars: +d.overall_sa,
        bedrooms: +d.bedrooms,
        accommodat: +d.accommodat

    }
}


