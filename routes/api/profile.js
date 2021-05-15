const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const axios = require('axios');
const config = require('config');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post')

//@route  GET api/profile/me
//@desc   Get current user's profile (by profile id)
//@access Private
router.get('/me', auth, async (req, res) => {
    try {
        //Find profile from profile model by user id and populate it with name and avatar from user model
        const profile = await Profile
            .findOne({ user: req.user.id })
            .populate('user', ['name', 'avatar']);

        //Check if there is no matching profile
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' })
        }
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

//@route  POST api/profile
//@desc   Create or update user profile
//@access Private
router.post(
    '/',
    [
        auth,
        [
            check('status', 'Status is required')
                .not()
                .isEmpty(),
            check('skills', 'Skills is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        //Destructuring the request
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            if (Array.isArray(skills)){
                profileFields.skills = skills;
            } else {
                profileFields.skills = skills.split(',').map(skill => skill.trim());
            }    
        }

        //Build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        //Update || create a profile
        try {
            let profile = await Profile.findOne({ user: req.user.id })

            //Update existing profile
            if (profile) {
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );

                return res.json(profile);
            }

            //Create profile
            profile = new Profile(profileFields);

            await profile.save();
            res.json(profile);

        } catch (err) {
            console.error(err.message)
            res.status(500).send('Server Error')
        }
    })

//@route  GET api/profile
//@desc   Get all profiles
//@access Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

//@route  GET api/profile/user/:user_id
//@desc   Get profile by user id
//@access Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile
            .findOne({ user: req.params.user_id })
            .populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' })
        }
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error')
    }
})

//@route  DELETE api/profile
//@desc   Delete profile, user & post
//@access Private
router.delete('/', auth, async (req, res) => {
    try {
        //Remove users posts
        await Post.deleteMany({ user: req.user.id })
        //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User deleted' })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

//@route  PUT api/profile/experience
//@desc   Add profile experience
//@access Private
router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is required')
                .not()
                .isEmpty(),
            check('company', 'Company is required')
                .not()
                .isEmpty(),
            check('from', 'From date is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error')
        }

    }
)

//@route  DELETE api/profile/experience/:exp_id
//@desc   Delete experience from profile
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        //Get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        if (removeIndex === -1) {
            return res.status(400).json({ msg: 'No experience entry with that id' });
        }

        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
})

//@route  PUT api/profile/education
//@desc   Add profile education
//@access Private
router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required')
                .not()
                .isEmpty(),
            check('degree', 'Degree is required')
                .not()
                .isEmpty(),
            check('fieldofstudy', 'Field of study is required')
                .not()
                .isEmpty(),
            check('from', 'From date is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error')
        }

    }
)

//@route  DELETE api/profile/education/:edu_id
//@desc   Delete education from profile
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        //Get the remove index
        const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id);
        if (removeIndex === -1) {
            return res.status(400).json({ msg: 'No education entry with that id' });
        }

        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
})

//@route  GET api/profile/github/:username
//@desc   Get user repos from Github
//@access Public
router.get('/github/:username', async (req, res) => {
    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            'user-agent': 'node.js',
            Authorization: `token ${config.get('githubToken')}`
        };

        const gitHubResponse = await axios.get(uri, { headers });
        return res.json(gitHubResponse.data);
    } catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: 'No Github profile found' });
    }
});


module.exports = router;