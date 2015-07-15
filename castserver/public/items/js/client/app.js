
App = {
	load: function() {
		// loading Jo is required
		jo.load();
		
		// typical card stack, nav and footer
		this.screen = new joScreen(
			new joFlexcol([
				this.stack = new joStackScroller(),
			])
		);
		
		// push our menu card
	    this.stack.push(joCache.get("connect"));
	    
	}
};
