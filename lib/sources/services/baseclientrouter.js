/**
 * @fileoverview Provide zz.routers.services.BaseClientRouter.
 * @license Apache-2.0
 * @author buntarb@gmail.com (Artem Lytvynov)
 */

goog.provide( 'zz.routers.services.BaseClientRouter' );

// GCL dependencies
goog.require( 'goog.dom' );
goog.require( 'goog.string' );
goog.require( 'goog.array' );
goog.require( 'goog.object' );
goog.require( 'goog.events');
goog.require( 'goog.History' );
goog.require( 'goog.Timer' );
goog.require( 'goog.history.Html5History' );
goog.require( 'goog.history.EventType' );

// IDK dependencies
goog.require( 'zz.environment.services.Environment' );
goog.require( 'zz.environment.enums.EventType' );
goog.require( 'zz.routers.events.Routed' );
goog.require( 'zz.routers.enums.BaseClientConstant' );
goog.require( 'zz.services.BaseService' );

/**
 * Router class.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
zz.routers.services.BaseClientRouter = function( ){

	goog.base( this );

	/**
	 * Envirinment service.
	 * @type {zz.environment.services.Environment}
	 * @private
	 */
	this.environment_ = zz.environment.services.Environment.getInstance( );

	/**
	 * Current route parameters.
	 * @type {Object}
	 */
	this.params = { };

	/**
	 * Current layout.
	 * @type {zz.mvc.view.BaseView}
	 * @private
	 */
	this.layout_ = undefined;

	/**
	 * Current view.
	 * @type {zz.mvc.view.BaseView}
	 * @private
	 */
	this.view_ = undefined;

	/**
	 * Routes settings.
	 * @type {Array}
	 * @private
	 */
	this.routes_ = [ ];

	/**
	 * Default url fragment.
	 * @type {string}
	 * @private
	 */
	this.defaultFragment_ = '';

	/**
	 * Current url fragment.
	 * @type {string}
	 * @private
	 */
	this.currentFragment_ = '';

	/**
	 * History event target object.
	 * @type {goog.history.Html5History|goog.History}
	 * @private
	 */
	this.history_ = goog.history.Html5History.isSupported( ) ?

		new goog.history.Html5History( ) :
		new goog.History( );

	/**
	 * Resize Timer id.
	 * @type {number}
	 */
	this.processingDelayId_;

	if( this.history_.setUseFragment ){

		this.history_.setUseFragment( true );
	}
	this.history_.setEnabled( true );
	goog.events.listen(

		this.history_,
		goog.history.EventType.NAVIGATE,
		this.onChange_,
		false,
		this
	);
	goog.events.listen(

		this.environment_,
		zz.environment.enums.EventType.RESIZE,
		function( ){

			if( ~this.processingDelayId_ ){

				goog.Timer.clear( this.processingDelayId_ );
			}
			this.processingDelayId_ = goog.Timer.callOnce( this.onChange_, 150, this );
		},
		false,
		this
	);
};
goog.inherits( zz.routers.services.BaseClientRouter, zz.services.BaseService );
goog.addSingletonGetter( zz.routers.services.BaseClientRouter );

/**
 * Run route callback if route regexp matches fragment.
 * @param {Object} route
 * @param {string} fragment
 * @returns {boolean}
 * @private
 */
zz.routers.services.BaseClientRouter.prototype.runRouteIfMatches_ = function( route, fragment ){

	// Clear params object.
	this.params = { };

	var args = route.route.exec( fragment );
	if( args ){

		// If route with params updating parameters object.
		if( route.params ){

			goog.array.forEach( route.params, function( param, index ){

				this.params[ param ] = args[ index + 1 ];

			}, this );
		}

		// If layout specified running router.
		if( route.layout ){

			if( !this.layout_ || route.layout !== this.layoutConstructor_ ){

				if ( this.layout_ ) {

					this.layout_.dispose( );
					this.layout_ = undefined;
					this.layoutConstructor_ = undefined;
					goog.dom.removeChildren( goog.dom.getElement( zz.routers.enums.BaseClientConstant.LAYOUT_ID ) );
				}

				// Setting up layout.
				this.layout_ = new route.layout( );
				this.layoutConstructor_ = route.layout;
				this.layout_.render( goog.dom.getElement(zz.routers.enums.BaseClientConstant.LAYOUT_ID ) );

			}
			this.layout_.setView( route.view );
		}
		if( route.callback ){

			route.callback.apply( route.context, args );
		}
		return true;
	}
	return false;
};

/**
 * History change events listener.
 * @private
 */
zz.routers.services.BaseClientRouter.prototype.onChange_ = function( ){

	var fragment = this.history_.getToken( );
	// TODO (buntarb): some globals here?
	if( true /*fragment !== this.currentFragment_*/ ){

		this.dispatchEvent( new zz.routers.events.Routed( this.currentFragment_, fragment ) );
		this.currentFragment_ = fragment;
		var isRouted = goog.array.find( this.routes_, function( route ){

			return this.runRouteIfMatches_( route, fragment );

		}, this );
		if( !isRouted ){

			this.setFragment( this.defaultFragment_ );
		}
	}
};

/**
 * Pass through the fragment for the URL.
 * @param {string} fragment
 */
zz.routers.services.BaseClientRouter.prototype.setFragment = function( fragment ){

	this.history_.setToken( fragment );
};

/**
 * Returns current routed fragment.
 * @return {string}
 */
zz.routers.services.BaseClientRouter.prototype.getFragment = function( ){

	return this.currentFragment_;
};

/**
 * Define route as string or regex.
 * @param {string|RegExp} route
 * @param {zz.views.BaseView=} opt_layout
 * @param {zz.views.BaseView=} opt_view
 * @param {Function=} opt_callback
 * @param {Object=} opt_context
 * @returns {zz.routers.services.BaseClientRouter}
 */
zz.routers.services.BaseClientRouter.prototype.when = function( route, opt_layout, opt_view, opt_callback, opt_context ){

	if( goog.isString( route ) ){

		var parsed = new RegExp( '^' + goog.string.regExpEscape( route )

			.replace( /\\:\w+/g, '([a-zA-Z0-9._-]+)' )
			.replace( /\\\*/g, '(.*)' )
			.replace( /\\\[/g, '(' )
			.replace( /\\\]/g, ')?' )
			.replace( /\\\{/g, '(?:' )
			.replace( /\\\}/g, ')?' ) + '$' );

		var paramsNames = route.match(/\:\w+/ig);
	}
	var completeRoute = {

		params: false,
		route: parsed,
		layout: opt_layout,
		view: opt_view,
		callback: opt_callback,
		context: opt_context
	};
	if( paramsNames ){

		completeRoute.params = [ ];
		goog.array.forEach( paramsNames, function( name ){

			completeRoute.params.push( name.replace( ':', '' ) );
		} );
	}
	this.routes_.push( completeRoute );
	return this;
};

/**
 * Fragment for default path.
 * @param {string} defaultFragment
 * @returns {zz.routers.services.BaseClientRouter}
 */
zz.routers.services.BaseClientRouter.prototype.otherwise = function( defaultFragment ){

	this.defaultFragment_ = defaultFragment;
	return this;
};

/**
 * Bootstrap router.
 */
zz.routers.services.BaseClientRouter.prototype.bootstrap = function( ){

	var fragment = this.history_.getToken( );
	this.currentFragment_ = fragment;
	goog.array.find( this.routes_ || [ ], function( route ){

		return this.runRouteIfMatches_( route, fragment );

	}, this );
};